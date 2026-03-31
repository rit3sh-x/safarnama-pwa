import { useState } from "react";
import {
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { format } from "date-fns";
import { Pencil } from "lucide-react";
import { PlaceRow } from "./place-row";
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from "@/components/ui/accordion";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Doc, Id } from "@backend/dataModel";

interface DayCardProps {
    day: Doc<"day">;
    index: number;
    date?: string;
    places: Doc<"place">[];
    isSelected: boolean;
    selectedPlaceId: Id<"place"> | null;
    onSelectDay: (dayId: Id<"day">) => void;
    onSelectPlace: (placeId: Id<"place">) => void;
    onRemovePlace?: (placeId: Id<"place">) => void;
    onUpdateTitle?: (dayId: Id<"day">, title: string) => void;
    onUpdateNote?: (dayId: Id<"day">, note: string) => void;
}

export function DayCard({
    day,
    index,
    date: dateProp,
    places,
    isSelected,
    selectedPlaceId,
    onSelectDay,
    onSelectPlace,
    onRemovePlace,
    onUpdateTitle,
    onUpdateNote,
}: DayCardProps) {
    const { setNodeRef, isOver } = useDroppable({ id: `day-${day._id}` });
    const [editOpen, setEditOpen] = useState(false);

    const rawDate = day.date || dateProp;
    const dateStr = rawDate
        ? format(new Date(rawDate), "EEE, MMM d")
        : null;
    const displayTitle = day.title || `Day ${index + 1}`;

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "border-b transition-colors",
                isOver && "bg-primary/5"
            )}
        >
            <Accordion
                defaultValue={[String(index)]}
                className="rounded-none border-0"
            >
                <AccordionItem
                    value={String(index)}
                    className={cn(
                        "rounded-none border-0",
                        isSelected && "bg-muted/50"
                    )}
                >
                    <AccordionTrigger
                        className="items-center gap-2 px-3 py-2.5 hover:no-underline"
                        onClick={() => onSelectDay(day._id)}
                    >
                        <div className="flex w-full items-center gap-2.5">
                            <div
                                className={cn(
                                    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                                    isSelected
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-muted-foreground"
                                )}
                            >
                                {index + 1}
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold">
                                    {displayTitle}
                                </p>
                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                    {dateStr && <span>{dateStr}</span>}
                                    {dateStr && places.length > 0 && (
                                        <span>·</span>
                                    )}
                                    {places.length > 0 && (
                                        <span>
                                            {places.length}{" "}
                                            {places.length === 1
                                                ? "place"
                                                : "places"}
                                        </span>
                                    )}
                                </div>
                                {day.note && (
                                    <p className="mt-0.5 truncate text-[10px] italic text-muted-foreground/60">
                                        {day.note}
                                    </p>
                                )}
                            </div>

                            {(onUpdateTitle || onUpdateNote) && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Edit day"
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
                        {places.length === 0 ? (
                            <div
                                className={cn(
                                    "py-3 text-center text-[11px] text-muted-foreground",
                                    isOver &&
                                    "rounded-lg border-2 border-dashed border-primary/30"
                                )}
                            >
                                {isOver
                                    ? "Drop here"
                                    : "Drag places here"}
                            </div>
                        ) : (
                            <SortableContext
                                items={places.map((p) => p._id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {places.map((place, i) => (
                                    <PlaceRow
                                        key={place._id}
                                        place={place}
                                        index={i}
                                        isSelected={
                                            place._id === selectedPlaceId
                                        }
                                        onSelect={onSelectPlace}
                                        onRemove={onRemovePlace}
                                    />
                                ))}
                            </SortableContext>
                        )}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            <DayEditDialog
                open={editOpen}
                onOpenChange={setEditOpen}
                title={day.title || ""}
                note={day.note || ""}
                dayLabel={`Day ${index + 1}`}
                onSave={(title, note) => {
                    if (title !== (day.title || ""))
                        onUpdateTitle?.(day._id, title);
                    if (note !== (day.note || ""))
                        onUpdateNote?.(day._id, note);
                    setEditOpen(false);
                }}
            />
        </div>
    );
}

export function DayEditDialog({
    open,
    onOpenChange,
    title: initialTitle,
    note: initialNote,
    dayLabel,
    onSave,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    note: string;
    dayLabel: string;
    onSave: (title: string, note: string) => void;
}) {
    const [title, setTitle] = useState(initialTitle);
    const [note, setNote] = useState(initialNote);

    const handleOpenChange = (v: boolean) => {
        if (v) {
            setTitle(initialTitle);
            setNote(initialNote);
        }
        onOpenChange(v);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Edit {dayLabel}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 py-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="day-title" className="text-xs">
                            Title
                        </Label>
                        <Input
                            id="day-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={dayLabel}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    onSave(title.trim(), note.trim());
                                }
                            }}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="day-note" className="text-xs">
                            Note
                        </Label>
                        <Textarea
                            id="day-note"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Add a note..."
                            rows={3}
                            className="resize-none"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        className={"flex-1"}
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        className={"flex-1"}
                        onClick={() =>
                            onSave(title.trim(), note.trim())
                        }
                    >
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
