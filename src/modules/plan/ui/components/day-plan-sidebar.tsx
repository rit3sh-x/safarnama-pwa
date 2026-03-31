import { useCallback, useMemo, useState } from "react";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { addDays, format, differenceInCalendarDays } from "date-fns";
import { Pencil } from "lucide-react";
import { SidebarHeader } from "./sidebar-header";
import { DayCard, DayEditDialog } from "./day-card";
import { Button } from "@/components/ui/button";
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Doc, Id } from "@backend/dataModel";

export interface DaySlot {
    _id: Id<"day"> | null;
    dayNumber: number;
    date: string | undefined;
    title: string | undefined;
    note: string | undefined;
    isVirtual: boolean;
}

interface DayPlanSidebarProps {
    trip: Doc<"trip">;
    days: Doc<"day">[];
    placesByDay: Record<string, Doc<"place">[]>;
    selectedDayId: Id<"day"> | null;
    selectedPlaceId: Id<"place"> | null;
    onSelectDay: (dayId: Id<"day">) => void;
    onSelectPlace: (placeId: Id<"place">) => void;
    onRemovePlace?: (placeId: Id<"place">) => void;
    onReorderPlaces?: (dayId: Id<"day">, placeIds: Id<"place">[]) => void;
    onMovePlaceToDay?: (placeId: Id<"place">, dayId: Id<"day">) => void;
    onUpdateDayTitle?: (dayId: Id<"day">, title: string) => void;
    onUpdateDayNote?: (dayId: Id<"day">, note: string) => void;
    onEnsureDay?: (dayNumber: number) => Promise<Id<"day">>;
    className?: string;
}

function buildDaySlots(
    trip: Doc<"trip">,
    dbDays: Doc<"day">[]
): DaySlot[] {
    if (!trip.startDate || !trip.endDate) {
        return dbDays.map((d) => ({
            _id: d._id,
            dayNumber: d.dayNumber,
            date: d.date,
            title: d.title,
            note: d.note,
            isVirtual: false,
        }));
    }

    const start = new Date(trip.startDate);
    const totalDays =
        differenceInCalendarDays(new Date(trip.endDate), start) + 1;

    const dbMap = new Map(dbDays.map((d) => [d.dayNumber, d]));
    const slots: DaySlot[] = [];

    for (let i = 0; i < totalDays; i++) {
        const dayNumber = i + 1;
        const dayDate = addDays(start, i);
        const dateStr = format(dayDate, "yyyy-MM-dd");
        const dbDay = dbMap.get(dayNumber);

        if (dbDay) {
            slots.push({
                _id: dbDay._id,
                dayNumber,
                date: dbDay.date ?? dateStr,
                title: dbDay.title,
                note: dbDay.note,
                isVirtual: false,
            });
        } else {
            slots.push({
                _id: null,
                dayNumber,
                date: dateStr,
                title: undefined,
                note: undefined,
                isVirtual: true,
            });
        }
    }

    return slots;
}

export function DayPlanSidebar({
    trip,
    days,
    placesByDay,
    selectedDayId,
    selectedPlaceId,
    onSelectDay,
    onSelectPlace,
    onRemovePlace,
    onReorderPlaces,
    onMovePlaceToDay,
    onUpdateDayTitle,
    onUpdateDayNote,
    onEnsureDay,
    className,
}: DayPlanSidebarProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    const daySlots = useMemo(() => buildDaySlots(trip, days), [trip, days]);

    const totalPlaces = Object.values(placesByDay).reduce(
        (sum, arr) => sum + arr.length,
        0
    );

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;
            if (!over || active.id === over.id) return;

            const activeId = active.id as Id<"place">;
            const overId = over.id as string;

            let activeDay: Doc<"day"> | null = null;
            for (const day of days) {
                if ((placesByDay[day._id] ?? []).some((p) => p._id === activeId)) {
                    activeDay = day;
                    break;
                }
            }

            if (overId.startsWith("day-") && !overId.startsWith("day-virtual")) {
                const targetDayId = overId.replace("day-", "") as Id<"day">;
                if (activeDay && activeDay._id !== targetDayId && onMovePlaceToDay) {
                    onMovePlaceToDay(activeId, targetDayId);
                }
                return;
            }

            if (overId.startsWith("virtual-day-") && onEnsureDay && onMovePlaceToDay) {
                const dayNumber = parseInt(overId.replace("virtual-day-", ""), 10);
                if (!isNaN(dayNumber)) {
                    onEnsureDay(dayNumber).then((dayId) => {
                        onMovePlaceToDay(activeId, dayId);
                    });
                }
                return;
            }

            let overDay: Doc<"day"> | null = null;
            for (const day of days) {
                if ((placesByDay[day._id] ?? []).some((p) => p._id === overId)) {
                    overDay = day;
                    break;
                }
            }

            if (!activeDay || !overDay) return;

            if (activeDay._id === overDay._id && onReorderPlaces) {
                const dayPlaces = placesByDay[activeDay._id] ?? [];
                const activeIdx = dayPlaces.findIndex((p) => p._id === activeId);
                const overIdx = dayPlaces.findIndex((p) => p._id === overId);
                if (activeIdx !== -1 && overIdx !== -1) {
                    const ids = dayPlaces.map((p) => p._id);
                    const [removed] = ids.splice(activeIdx, 1);
                    ids.splice(overIdx, 0, removed);
                    onReorderPlaces(activeDay._id, ids);
                }
            } else if (onMovePlaceToDay) {
                onMovePlaceToDay(activeId, overDay._id);
            }
        },
        [days, placesByDay, onReorderPlaces, onMovePlaceToDay, onEnsureDay]
    );

    return (
        <div
            className={cn(
                "pointer-events-auto flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-xl",
                className
            )}
        >
            <SidebarHeader
                trip={trip}
                dayCount={daySlots.length}
                totalPlaces={totalPlaces}
            />

            <ScrollArea className="min-h-0 flex-1">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    {daySlots.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
                            <p className="text-sm text-muted-foreground">
                                No days planned yet
                            </p>
                            <p className="text-xs text-muted-foreground/70">
                                Set trip dates to see your day plan
                            </p>
                        </div>
                    ) : (
                        daySlots.map((slot) => {
                            if (slot._id) {
                                const day = days.find(
                                    (d) => d._id === slot._id
                                )!;
                                return (
                                    <DayCard
                                        key={slot._id}
                                        day={day}
                                        index={slot.dayNumber - 1}
                                        date={slot.date}
                                        places={
                                            placesByDay[slot._id] ?? []
                                        }
                                        isSelected={
                                            slot._id === selectedDayId
                                        }
                                        selectedPlaceId={selectedPlaceId}
                                        onSelectDay={onSelectDay}
                                        onSelectPlace={onSelectPlace}
                                        onRemovePlace={onRemovePlace}
                                        onUpdateTitle={onUpdateDayTitle}
                                        onUpdateNote={onUpdateDayNote}
                                    />
                                );
                            }

                            return (
                                <VirtualDayCard
                                    key={`virtual-${slot.dayNumber}`}
                                    slot={slot}
                                    onEnsureDay={onEnsureDay}
                                    onMovePlaceToDay={onMovePlaceToDay}
                                    onUpdateDayTitle={onUpdateDayTitle}
                                    onUpdateDayNote={onUpdateDayNote}
                                />
                            );
                        })
                    )}
                </DndContext>
            </ScrollArea>
        </div>
    );
}

function VirtualDayCard({
    slot,
    onEnsureDay,
    onUpdateDayTitle,
    onUpdateDayNote,
}: {
    slot: DaySlot;
    onEnsureDay?: (dayNumber: number) => Promise<Id<"day">>;
    onMovePlaceToDay?: (placeId: Id<"place">, dayId: Id<"day">) => void;
    onUpdateDayTitle?: (dayId: Id<"day">, title: string) => void;
    onUpdateDayNote?: (dayId: Id<"day">, note: string) => void;
}) {
    const { setNodeRef, isOver } = useDroppable({
        id: `virtual-day-${slot.dayNumber}`,
    });
    const [editOpen, setEditOpen] = useState(false);

    const dateStr = slot.date
        ? format(new Date(slot.date), "EEE, MMM d")
        : null;

    const handleSave = async (title: string, note: string) => {
        if (!onEnsureDay) return;
        const dayId = await onEnsureDay(slot.dayNumber);
        if (title) onUpdateDayTitle?.(dayId, title);
        if (note) onUpdateDayNote?.(dayId, note);
        setEditOpen(false);
    };

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "border-b opacity-50 transition-all hover:opacity-75",
                isOver && "bg-primary/5 opacity-100"
            )}
        >
            <Accordion className="rounded-none border-0">
                <AccordionItem
                    value={`virtual-${slot.dayNumber}`}
                    className="rounded-none border-0"
                >
                    <AccordionTrigger className="items-center gap-2 px-3 py-2.5 hover:no-underline">
                        <div className="flex w-full items-center gap-2.5">
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                                {slot.dayNumber}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold">
                                    Day {slot.dayNumber}
                                </p>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    {dateStr && <span>{dateStr}</span>}
                                </div>
                            </div>
                            {onEnsureDay && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-6 shrink-0"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditOpen(true);
                                    }}
                                >
                                    <Pencil className="size-3 text-muted-foreground" />
                                </Button>
                            )}
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-1 pb-1">
                        <div
                            className={cn(
                                "py-3 text-center text-xs text-muted-foreground",
                                isOver &&
                                    "rounded-lg border-2 border-dashed border-primary/30"
                            )}
                        >
                            {isOver ? "Drop here" : "Drag places here"}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            <DayEditDialog
                open={editOpen}
                onOpenChange={setEditOpen}
                title=""
                note=""
                dayLabel={`Day ${slot.dayNumber}`}
                onSave={handleSave}
            />
        </div>
    );
}
