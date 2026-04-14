import { useMemo } from "react";
import { addDays, differenceInCalendarDays, format } from "date-fns";
import { useDroppable } from "@dnd-kit/core";
import { DayCard } from "./day-card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Doc, Id } from "@backend/dataModel";

export interface DaySlot {
    dayNumber: number;
    date: string;
    real: Doc<"day"> | null;
}

function buildDaySlots(trip: Doc<"trip">, dbDays: Doc<"day">[]): DaySlot[] {
    if (!trip.startDate || !trip.endDate) {
        return dbDays.map((d, i) => ({
            dayNumber: d.dayNumber ?? i + 1,
            date: d.date ?? "",
            real: d,
        }));
    }

    const start = new Date(trip.startDate);
    const totalDays =
        differenceInCalendarDays(new Date(trip.endDate), start) + 1;

    const dbByNumber = new Map<number, Doc<"day">>();
    dbDays.forEach((d, i) => {
        dbByNumber.set(d.dayNumber ?? i + 1, d);
    });

    const slots: DaySlot[] = [];
    for (let i = 0; i < totalDays; i++) {
        const dayNumber = i + 1;
        const date = format(addDays(start, i), "yyyy-MM-dd");
        slots.push({
            dayNumber,
            date,
            real: dbByNumber.get(dayNumber) ?? null,
        });
    }
    return slots;
}

interface DaysAccordionSectionProps {
    trip: Doc<"trip">;
    days: Doc<"day">[];
    placesByDay: Record<string, Doc<"place">[]>;
    expandedDayId: Id<"day"> | null;
    onToggleExpand: (dayId: Id<"day">) => void;
    selectedPlaceId: Id<"place"> | null;
    onSelectDay: (dayId: Id<"day">) => void;
    onSelectPlace: (placeId: Id<"place">) => void;
    onRemovePlace: (placeId: Id<"place">) => void;
    onUpdateDayTitle: (dayId: Id<"day">, title: string) => void;
    onUpdateDayNote: (dayId: Id<"day">, note: string) => void;
    onEnsureDay: (dayNumber: number) => Promise<Id<"day">>;
    className?: string;
}

export function DaysAccordionSection({
    trip,
    days,
    placesByDay,
    expandedDayId,
    onToggleExpand,
    selectedPlaceId,
    onSelectDay,
    onSelectPlace,
    onRemovePlace,
    onUpdateDayTitle,
    onUpdateDayNote,
    onEnsureDay,
    className,
}: DaysAccordionSectionProps) {
    const slots = useMemo(() => buildDaySlots(trip, days), [trip, days]);

    const handleVirtualClick = async (dayNumber: number) => {
        const id = await onEnsureDay(dayNumber);
        onSelectDay(id);
        onToggleExpand(id);
    };

    if (slots.length === 0) {
        return (
            <div
                className={cn(
                    "flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-4 py-8 text-center",
                    className
                )}
            >
                <p className="text-xs text-muted-foreground">
                    Set trip dates to see your itinerary.
                </p>
                <Button size="sm" onClick={() => handleVirtualClick(1)}>
                    <Plus className="mr-1 size-3.5" />
                    Add first day
                </Button>
            </div>
        );
    }

    return (
        <div className={cn("min-h-0 flex-1 overflow-y-auto", className)}>
            {slots.map((slot, i) =>
                slot.real ? (
                    <DayCard
                        key={`real-${slot.real._id}`}
                        day={slot.real}
                        index={i}
                        date={slot.date}
                        places={placesByDay[slot.real._id] ?? []}
                        isSelected={slot.real._id === expandedDayId}
                        selectedPlaceId={selectedPlaceId}
                        onSelectDay={onSelectDay}
                        onSelectPlace={onSelectPlace}
                        onRemovePlace={onRemovePlace}
                        onUpdateTitle={onUpdateDayTitle}
                        onUpdateNote={onUpdateDayNote}
                        isExpanded={slot.real._id === expandedDayId}
                        onToggleExpand={onToggleExpand}
                    />
                ) : (
                    <VirtualDayCard
                        key={`virtual-${slot.dayNumber}`}
                        dayNumber={slot.dayNumber}
                        date={slot.date}
                        onClick={() => handleVirtualClick(slot.dayNumber)}
                    />
                )
            )}
        </div>
    );
}

function VirtualDayCard({
    dayNumber,
    date,
    onClick,
}: {
    dayNumber: number;
    date: string;
    onClick: () => void;
}) {
    const { setNodeRef, isOver } = useDroppable({
        id: `virtual-day-${dayNumber}`,
    });

    const dateStr = date ? format(new Date(date), "EEE, MMM d") : null;

    return (
        <div
            ref={setNodeRef}
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onClick();
                }
            }}
            className={cn(
                "flex cursor-pointer items-center gap-2.5 border-b border-dashed px-3 py-2.5 transition-colors hover:bg-muted/40",
                isOver && "border-primary/40 bg-primary/5"
            )}
        >
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-dashed text-xs font-bold text-muted-foreground">
                {dayNumber}
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-muted-foreground">
                    Day {dayNumber}
                </p>
                {dateStr && (
                    <p className="truncate text-xs text-muted-foreground/60">
                        {dateStr}
                    </p>
                )}
            </div>
            <span className="text-xs text-muted-foreground/50">
                {isOver ? "Drop here" : "Empty"}
            </span>
        </div>
    );
}
