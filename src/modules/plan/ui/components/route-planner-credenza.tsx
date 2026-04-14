import { useEffect, useMemo, useState } from "react";
import {
    ArrowRight,
    Bike,
    Car,
    Circle,
    Flag,
    Footprints,
    MapPin,
    Minus,
    Plus,
    Route as RouteIcon,
    Trash2,
    X,
} from "lucide-react";
import {
    Credenza,
    CredenzaBody,
    CredenzaContent,
    CredenzaDescription,
    CredenzaFooter,
    CredenzaHeader,
    CredenzaTitle,
} from "@/components/ui/credenza";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { cn, getInitials, stringToHex } from "@/lib/utils";
import {
    buildPathId,
    formatDistance,
    formatDuration,
    useRoutePlanner,
    type PathEntry,
    type TravelMode,
} from "../../hooks/use-route-planner";
import type { Doc, Id } from "@backend/dataModel";

interface RoutePlannerCredenzaProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tripId: Id<"trip">;
    places: Doc<"place">[];
    onPathAdded: (entry: PathEntry) => void;
    onPathRemoved: (pathId: string) => void;
}

type SlotId = "start" | "end" | `mid-${number}`;

interface Slot {
    id: SlotId;
    placeId: Id<"place"> | null;
}

const MODES: { id: TravelMode; label: string; icon: typeof Footprints }[] = [
    { id: "walking", label: "Walk", icon: Footprints },
    { id: "driving", label: "Drive", icon: Car },
    { id: "cycling", label: "Cycle", icon: Bike },
];

function PlaceDot({ place }: { place: Doc<"place"> | null | undefined }) {
    if (!place) {
        return (
            <div className="flex size-7 items-center justify-center rounded-full border border-dashed border-border bg-muted/40">
                <Circle className="size-3 text-muted-foreground/50" />
            </div>
        );
    }
    const { bg, text } = stringToHex(place.name);
    return (
        <div
            className="flex size-7 items-center justify-center overflow-hidden rounded-full ring-2 ring-background"
            style={{ background: bg }}
        >
            {place.imageUrl ? (
                <img
                    src={place.imageUrl}
                    alt=""
                    className="size-full object-cover"
                />
            ) : (
                <span
                    className="text-[9px] leading-none font-bold"
                    style={{ color: text }}
                >
                    {getInitials(place.name) || "?"}
                </span>
            )}
        </div>
    );
}

export function RoutePlannerCredenza({
    open,
    onOpenChange,
    tripId,
    places,
    onPathAdded,
    onPathRemoved,
}: RoutePlannerCredenzaProps) {
    const geoPlaces = useMemo(
        () => places.filter((p) => p.lat != null && p.lng != null),
        [places]
    );
    const placeById = useMemo(() => {
        const m = new Map<Id<"place">, Doc<"place">>();
        for (const p of geoPlaces) m.set(p._id, p);
        return m;
    }, [geoPlaces]);

    const [slots, setSlots] = useState<Slot[]>([
        { id: "start", placeId: null },
        { id: "end", placeId: null },
    ]);
    const [mode, setMode] = useState<TravelMode>("walking");
    const [currentPathId, setCurrentPathId] = useState<string | null>(null);
    const { result, isLoading, error, fetchRoute, clear } = useRoutePlanner();

    const usedIds = useMemo(() => {
        const s = new Set<Id<"place">>();
        for (const slot of slots) if (slot.placeId) s.add(slot.placeId);
        return s;
    }, [slots]);

    const canAddStop = slots.length < geoPlaces.length;

    useEffect(() => {
        if (!open) {
            clear();
        }
    }, [open, clear]);

    const setSlotPlace = (id: SlotId, placeId: Id<"place"> | null) => {
        setSlots((cur) =>
            cur.map((s) => (s.id === id ? { ...s, placeId } : s))
        );
    };

    const addWaypoint = () => {
        setSlots((cur) => {
            const mids = cur.filter((s) => s.id.startsWith("mid-"));
            const next: Slot = {
                id: `mid-${mids.length}` as SlotId,
                placeId: null,
            };
            const end = cur[cur.length - 1];
            const withoutEnd = cur.slice(0, -1);
            return [...withoutEnd, next, end];
        });
    };

    const removeSlot = (id: SlotId) => {
        setSlots((cur) => cur.filter((s) => s.id !== id));
    };

    const swapEnds = () => {
        setSlots((cur) => {
            if (cur.length < 2) return cur;
            const first = cur[0];
            const last = cur[cur.length - 1];
            const middle = cur.slice(1, -1).reverse();
            return [
                { ...first, placeId: last.placeId },
                ...middle,
                { ...last, placeId: first.placeId },
            ];
        });
    };

    const filled = slots
        .map((s) => (s.placeId ? placeById.get(s.placeId) : null))
        .filter((p): p is Doc<"place"> => !!p);

    const uniquePickCount = new Set(
        slots.map((s) => s.placeId).filter((id): id is Id<"place"> => !!id)
    ).size;

    const canPlot = uniquePickCount >= 2;

    const selectionKey = useMemo(
        () => `${mode}:${slots.map((s) => s.placeId ?? "_").join("-")}`,
        [slots, mode]
    );

    useEffect(() => {
        if (!open) return;

        if (!canPlot) {
            clear();
            return;
        }

        const waypoints: [number, number][] = filled.map((p) => [
            p.lng!,
            p.lat!,
        ]);
        const placeIds = filled.map((p) => p._id);

        let cancelled = false;
        fetchRoute(waypoints, mode, tripId, placeIds).then((entry) => {
            if (!cancelled && entry) {
                setCurrentPathId(entry.pathId);
                onPathAdded(entry);
            }
        });

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectionKey, open, tripId]);

    const handleRemoveRoute = () => {
        const pathId =
            currentPathId ??
            buildPathId(
                mode,
                filled.map((p) => p._id)
            );
        if (currentPathId || filled.length >= 2) {
            onPathRemoved(pathId);
        }
        setCurrentPathId(null);
        clear();
        setSlots([
            { id: "start", placeId: null },
            { id: "end", placeId: null },
        ]);
    };

    return (
        <Credenza open={open} onOpenChange={onOpenChange}>
            <CredenzaContent className="sm:max-w-md">
                <CredenzaHeader>
                    <CredenzaTitle className="flex items-center gap-2">
                        <RouteIcon className="size-4 text-primary" />
                        Plan a route
                    </CredenzaTitle>
                    <CredenzaDescription>
                        Pick stops from your trip places and we&apos;ll trace
                        the way between them.
                    </CredenzaDescription>
                </CredenzaHeader>

                <CredenzaBody className="space-y-4 pb-2">
                    <div className="flex gap-1.5 rounded-xl border bg-muted/40 p-1">
                        {MODES.map((m) => {
                            const Icon = m.icon;
                            const active = m.id === mode;
                            return (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => setMode(m.id)}
                                    className={cn(
                                        "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition",
                                        active
                                            ? "bg-background text-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Icon className="size-3.5" />
                                    {m.label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="relative space-y-2">
                        <span className="pointer-events-none absolute top-5 bottom-5 left-2 w-px bg-border/80" />
                        {slots.map((slot, i) => {
                            const place = slot.placeId
                                ? placeById.get(slot.placeId)
                                : null;
                            const isStart = slot.id === "start";
                            const isEnd = slot.id === "end";
                            const isMid = !isStart && !isEnd;
                            const label = isStart
                                ? "Start"
                                : isEnd
                                  ? "Destination"
                                  : `Stop ${i}`;
                            return (
                                <div
                                    key={slot.id}
                                    className="relative flex items-center gap-3"
                                >
                                    <div className="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border">
                                        {isStart && (
                                            <MapPin className="size-3.5 text-primary" />
                                        )}
                                        {isEnd && (
                                            <Flag className="size-3.5 text-primary" />
                                        )}
                                        {isMid && <PlaceDot place={place} />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                                            {label}
                                        </p>
                                        <Select
                                            value={slot.placeId ?? ""}
                                            onValueChange={(v) =>
                                                setSlotPlace(
                                                    slot.id,
                                                    v as Id<"place">
                                                )
                                            }
                                        >
                                            <SelectTrigger className="h-9 w-full border-none bg-transparent px-0 shadow-none hover:bg-transparent focus:ring-0">
                                                {place ? (
                                                    <span className="truncate text-sm">
                                                        {place.name}
                                                    </span>
                                                ) : (
                                                    <SelectValue placeholder="Pick a place…" />
                                                )}
                                            </SelectTrigger>
                                            <SelectContent>
                                                {geoPlaces.length === 0 ? (
                                                    <div className="px-2 py-3 text-xs text-muted-foreground">
                                                        No places with
                                                        coordinates yet.
                                                    </div>
                                                ) : (
                                                    geoPlaces
                                                        .filter(
                                                            (p) =>
                                                                p._id ===
                                                                    slot.placeId ||
                                                                !usedIds.has(
                                                                    p._id
                                                                )
                                                        )
                                                        .map((p) => (
                                                            <SelectItem
                                                                key={p._id}
                                                                value={p._id}
                                                            >
                                                                {p.name}
                                                            </SelectItem>
                                                        ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {isMid && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            aria-label="Remove stop"
                                            className="size-7 rounded-full text-muted-foreground hover:text-destructive"
                                            onClick={() => removeSlot(slot.id)}
                                        >
                                            <X className="size-3.5" />
                                        </Button>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-xs"
                            onClick={addWaypoint}
                            disabled={!canAddStop}
                        >
                            <Plus className="size-3.5" /> Add stop
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="ml-auto gap-1.5 text-xs"
                            onClick={swapEnds}
                        >
                            <ArrowRight className="size-3.5 rotate-90" />
                            Reverse
                        </Button>
                    </div>

                    {(result || error || isLoading) && (
                        <div
                            className={cn(
                                "relative rounded-xl border px-3 py-2.5 text-xs",
                                error
                                    ? "border-destructive/30 bg-destructive/5 text-destructive"
                                    : "border-border bg-muted/30"
                            )}
                        >
                            {isLoading && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Spinner className="size-3" />
                                    Fetching route…
                                </div>
                            )}
                            {error && !isLoading && <span>{error}</span>}
                            {result && !isLoading && !error && (
                                <div className="flex items-center justify-between gap-4 pr-7">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                                            Distance
                                        </span>
                                        <span className="text-sm font-semibold text-foreground">
                                            {formatDistance(
                                                result.distanceMeters
                                            )}
                                        </span>
                                    </div>
                                    <div className="h-8 w-px bg-border" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                                            Duration
                                        </span>
                                        <span className="text-sm font-semibold text-foreground">
                                            {formatDuration(
                                                result.durationSeconds
                                            )}
                                        </span>
                                    </div>
                                </div>
                            )}
                            {result && !isLoading && !error && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Remove plotted route"
                                    className="absolute top-1.5 right-1.5 size-6 rounded-full text-muted-foreground hover:text-destructive"
                                    onClick={handleRemoveRoute}
                                >
                                    <Minus className="size-3.5" />
                                </Button>
                            )}
                        </div>
                    )}
                </CredenzaBody>

                <CredenzaFooter className="flex-row gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1.5"
                        onClick={handleRemoveRoute}
                    >
                        <Trash2 className="size-3.5" />
                        Clear
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        className="ml-auto gap-1.5"
                        onClick={() => onOpenChange(false)}
                    >
                        <RouteIcon className="size-3.5" />
                        Done
                    </Button>
                </CredenzaFooter>
            </CredenzaContent>
        </Credenza>
    );
}
