import { useCallback, useState } from "react";
import {
    DndContext,
    type DragEndEvent,
    DragOverlay,
    type DragStartEvent,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { ChevronDown, PanelLeftClose, Plus, X } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DaysAccordionSection } from "./days-accordion-section";
import { PlacesAccordionSection } from "./places-accordion-section";
import { SidebarRail } from "./sidebar-rail";
import { PlaceRowContent } from "./place-row-content";
import { useMovePlace } from "../../hooks/use-move-place";
import type { Doc, Id } from "@backend/dataModel";

export const SIDEBAR_WIDTH = 410;

interface UnifiedSidebarProps {
    trip: Doc<"trip">;
    days: Doc<"day">[];
    places: Doc<"place">[];
    placesByDay: Record<string, Doc<"place">[]>;
    selectedDayId: Id<"day"> | null;
    selectedPlaceId: Id<"place"> | null;
    isMobile: boolean;
    collapsed: boolean;
    mobileOpen: boolean;
    onCollapsedChange: (collapsed: boolean) => void;
    onMobileOpenChange: (open: boolean) => void;
    onSelectDay: (dayId: Id<"day">) => void;
    onSelectPlace: (placeId: Id<"place"> | null) => void;
    onAddPlace: () => void;
    onDeletePlace: (placeId: Id<"place">) => void;
    onRemoveFromDay: (placeId: Id<"place">) => void;
    onReorderPlaces: (dayId: Id<"day">, placeIds: Id<"place">[]) => void;
    onUpdateDayTitle: (dayId: Id<"day">, title: string) => void;
    onUpdateDayNote: (dayId: Id<"day">, note: string) => void;
    onEnsureDay: (dayNumber: number) => Promise<Id<"day">>;
}

interface ActiveDrag {
    type: "place";
    placeId: Id<"place">;
    fromDayId: Id<"day"> | null;
}

export function UnifiedSidebar(props: UnifiedSidebarProps) {
    const {
        trip,
        days,
        places,
        placesByDay,
        selectedDayId,
        selectedPlaceId,
        isMobile,
        collapsed,
        mobileOpen,
        onCollapsedChange,
        onMobileOpenChange,
        onSelectDay,
        onSelectPlace,
        onAddPlace,
        onDeletePlace,
        onRemoveFromDay,
        onReorderPlaces,
        onUpdateDayTitle,
        onUpdateDayNote,
        onEnsureDay,
    } = props;

    const [daysOpen, setDaysOpen] = useState(true);
    const [placesOpen, setPlacesOpen] = useState(true);
    const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);

    const movePlace = useMovePlace();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 4 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleToggleDays = useCallback(() => {
        setDaysOpen((v) => {
            if (v && !placesOpen) {
                // Don't allow both to be closed — opening Places instead.
                setPlacesOpen(true);
                return false;
            }
            return !v;
        });
    }, [placesOpen]);

    const handleTogglePlaces = useCallback(() => {
        setPlacesOpen((v) => {
            if (v && !daysOpen) {
                setDaysOpen(true);
                return false;
            }
            return !v;
        });
    }, [daysOpen]);

    const handleAddFirstDay = useCallback(async () => {
        await onEnsureDay(days.length + 1);
    }, [days.length, onEnsureDay]);

    const handleDragStart = useCallback(
        (event: DragStartEvent) => {
            const id = String(event.active.id);
            if (id.startsWith("place-")) {
                const placeId = id.slice("place-".length) as Id<"place">;
                setActiveDrag({ type: "place", placeId, fromDayId: null });
                return;
            }
            const placeId = id as Id<"place">;
            const place = places.find((p) => p._id === placeId);
            setActiveDrag({
                type: "place",
                placeId,
                fromDayId: place?.dayId ?? null,
            });
        },
        [places]
    );

    const handleDragEnd = useCallback(
        async (event: DragEndEvent) => {
            const drag = activeDrag;
            setActiveDrag(null);
            if (!drag || !event.over) return;

            const overId = String(event.over.id);
            const { placeId, fromDayId } = drag;

            if (overId.startsWith("virtual-day-")) {
                const dayNumber = parseInt(
                    overId.slice("virtual-day-".length),
                    10
                );
                if (Number.isNaN(dayNumber)) return;
                const dayId = await onEnsureDay(dayNumber);
                await movePlace({ placeId, dayId });
                return;
            }

            if (overId.startsWith("day-")) {
                const dayId = overId.slice("day-".length) as Id<"day">;
                if (dayId === fromDayId) return;
                await movePlace({ placeId, dayId });
                return;
            }

            const targetPlace = places.find((p) => p._id === overId);
            if (!targetPlace || !targetPlace.dayId) return;

            const targetDayId = targetPlace.dayId;
            const dayList = placesByDay[targetDayId] ?? [];
            const targetIndex = dayList.findIndex((p) => p._id === overId);

            if (fromDayId === targetDayId) {
                const currentIds = dayList.map((p) => p._id);
                const fromIndex = currentIds.findIndex((id) => id === placeId);
                if (fromIndex === -1 || targetIndex === -1) return;
                const next = arrayMove(currentIds, fromIndex, targetIndex);
                onReorderPlaces(targetDayId, next);
                return;
            }

            await movePlace({
                placeId,
                dayId: targetDayId,
                position: targetIndex,
                currentDayPlaceIds: dayList.map((p) => p._id),
            });
        },
        [
            activeDrag,
            movePlace,
            places,
            placesByDay,
            onReorderPlaces,
            onEnsureDay,
        ]
    );

    const activePlace = activeDrag
        ? (places.find((p) => p._id === activeDrag.placeId) ?? null)
        : null;

    const content = (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveDrag(null)}
        >
            <div className="flex h-full w-full flex-col">
                <section
                    className={cn(
                        "flex min-h-0 flex-col",
                        daysOpen && "flex-1"
                    )}
                >
                    <SectionHeader
                        label="Days"
                        count={days.length}
                        open={daysOpen}
                        onToggle={handleToggleDays}
                        action={
                            !trip.startDate || !trip.endDate ? (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Add day"
                                    className="size-7"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        void handleAddFirstDay();
                                    }}
                                >
                                    <Plus className="size-3.5" />
                                </Button>
                            ) : null
                        }
                    />
                    {daysOpen && (
                        <DaysAccordionSection
                            trip={trip}
                            days={days}
                            placesByDay={placesByDay}
                            expandedDayId={selectedDayId}
                            onToggleExpand={onSelectDay}
                            selectedPlaceId={selectedPlaceId}
                            onSelectDay={onSelectDay}
                            onSelectPlace={onSelectPlace}
                            onRemovePlace={onRemoveFromDay}
                            onUpdateDayTitle={onUpdateDayTitle}
                            onUpdateDayNote={onUpdateDayNote}
                            onEnsureDay={onEnsureDay}
                        />
                    )}
                </section>

                <section
                    className={cn(
                        "flex min-h-0 flex-col border-t",
                        placesOpen && "flex-1"
                    )}
                >
                    <SectionHeader
                        label="Places"
                        count={places.length}
                        open={placesOpen}
                        onToggle={handleTogglePlaces}
                        action={
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Add place"
                                className="size-7"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAddPlace();
                                }}
                            >
                                <Plus className="size-3.5" />
                            </Button>
                        }
                    />
                    {placesOpen && (
                        <PlacesAccordionSection
                            places={places}
                            selectedPlaceId={selectedPlaceId}
                            onSelectPlace={onSelectPlace}
                            onDeletePlace={onDeletePlace}
                            isMobile={isMobile}
                        />
                    )}
                </section>
            </div>

            <DragOverlay dropAnimation={null}>
                {activePlace ? (
                    <div className="pointer-events-none">
                        <PlaceRowContent
                            place={activePlace}
                            isSelected={false}
                            isDragging
                            onSelect={() => {}}
                            className="rounded-lg border bg-background shadow-lg"
                        />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );

    if (isMobile) {
        return (
            <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
                <SheetContent
                    side="left"
                    className="w-full max-w-sm p-0 sm:max-w-md [&>button]:hidden"
                >
                    <div className="flex h-full flex-col">
                        <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
                            <span className="text-sm font-semibold">Plan</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Close sidebar"
                                className="size-8 rounded-full"
                                onClick={() => onMobileOpenChange(false)}
                            >
                                <X className="size-4" />
                            </Button>
                        </div>
                        <div className="min-h-0 flex-1 overflow-hidden">
                            {content}
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        );
    }

    if (collapsed) {
        return (
            <div className="pointer-events-auto absolute inset-y-2.5 left-2.5 z-20 hidden md:block">
                <SidebarRail
                    onExpand={(preOpen) => {
                        onCollapsedChange(false);
                        setDaysOpen(preOpen === "days");
                        setPlacesOpen(preOpen === "places");
                    }}
                />
            </div>
        );
    }

    return (
        <div
            className="pointer-events-auto absolute inset-y-2.5 left-2.5 z-20 hidden md:block"
            style={{ width: SIDEBAR_WIDTH }}
        >
            <div className="relative h-full rounded-xl border bg-background shadow-lg">
                <Button
                    variant="secondary"
                    size="icon"
                    aria-label="Collapse sidebar"
                    className="absolute top-3 -right-11 z-10 size-9 rounded-lg"
                    onClick={() => onCollapsedChange(true)}
                >
                    <PanelLeftClose className="size-4" />
                </Button>
                <div className="h-full overflow-hidden rounded-xl">
                    {content}
                </div>
            </div>
        </div>
    );
}

function SectionHeader({
    label,
    count,
    open,
    onToggle,
    action,
}: {
    label: string;
    count: number;
    open: boolean;
    onToggle: () => void;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex shrink-0 items-center justify-between border-b bg-background px-3 py-2">
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={open}
                className="flex flex-1 items-center gap-2 text-left transition-colors hover:text-foreground"
            >
                <ChevronDown
                    className={cn(
                        "size-3.5 text-muted-foreground transition-transform",
                        !open && "-rotate-90"
                    )}
                />
                <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {label} · {count}
                </span>
            </button>
            {action}
        </div>
    );
}
