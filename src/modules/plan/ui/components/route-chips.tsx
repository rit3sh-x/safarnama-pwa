import { useMemo } from "react";
import { ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PathEntry } from "../../hooks/use-route-planner";
import { formatDistance, formatDuration } from "../../hooks/use-route-planner";
import type { Doc, Id } from "@backend/dataModel";
import { PATH_COLORS } from "../../constants";

interface RouteChipsProps {
    routes: PathEntry[];
    places: Doc<"place">[];
    onRemove: (pathId: string) => void;
    leftOffset: number;
    className?: string;
}

export function RouteChips({
    routes,
    places,
    onRemove,
    leftOffset,
    className,
}: RouteChipsProps) {
    const placesById = useMemo(() => {
        const m = new Map<Id<"place">, Doc<"place">>();
        for (const p of places) m.set(p._id, p);
        return m;
    }, [places]);

    if (routes.length === 0) return null;

    return (
        <div
            className={cn(
                "pointer-events-none absolute top-4 z-30 flex flex-col items-center gap-1.5",
                className
            )}
            style={{ left: leftOffset, right: 16 }}
        >
            {routes.map((route, i) => {
                const color = PATH_COLORS[i % PATH_COLORS.length];
                const first = placesById.get(route.placeIds[0] as Id<"place">);
                const last = placesById.get(
                    route.placeIds[route.placeIds.length - 1] as Id<"place">
                );
                const midStops = Math.max(0, route.placeIds.length - 2);

                return (
                    <div
                        key={route.pathId}
                        className="pointer-events-auto flex max-w-full items-center gap-2 rounded-full border bg-background/95 py-1 pr-1 pl-3 shadow-md backdrop-blur-sm transition-shadow hover:shadow-lg"
                        title={`${formatDistance(route.distanceMeters)} · ${formatDuration(route.durationSeconds)}`}
                    >
                        <span
                            className="size-2 shrink-0 rounded-full ring-2 ring-background"
                            style={{ background: color }}
                            aria-hidden
                        />
                        <span className="max-w-36 truncate text-xs font-medium text-foreground">
                            {first?.name ?? "?"}
                        </span>
                        <ArrowRight className="size-3 shrink-0 text-muted-foreground/70" />
                        {midStops > 0 && (
                            <span className="shrink-0 rounded-full bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground">
                                +{midStops}
                            </span>
                        )}
                        <span className="max-w-36 truncate text-xs font-medium text-foreground">
                            {last?.name ?? "?"}
                        </span>
                        <span className="ml-1 shrink-0 text-[10px] font-medium text-muted-foreground/80">
                            {formatDistance(route.distanceMeters)}
                        </span>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Remove route"
                            className="ml-0.5 size-6 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => onRemove(route.pathId)}
                        >
                            <X className="size-3" />
                        </Button>
                    </div>
                );
            })}
        </div>
    );
}
