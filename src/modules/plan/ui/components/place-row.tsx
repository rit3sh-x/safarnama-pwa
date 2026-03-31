import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Clock, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { PlaceAvatar } from "./place-avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSettings } from "@/modules/settings/hooks/use-settings";
import type { Doc, Id } from "@backend/dataModel";

interface PlaceRowProps {
    place: Doc<"place">;
    index: number;
    isSelected: boolean;
    onSelect: (placeId: Id<"place">) => void;
    onRemove?: (placeId: Id<"place">) => void;
}

export function PlaceRow({
    place,
    index,
    isSelected,
    onSelect,
    onRemove,
}: PlaceRowProps) {
    const { timeFormat } = useSettings();
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: place._id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={() => onSelect(place._id)}
            className={cn(
                "group/row flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors",
                isSelected ? "bg-primary/10" : "hover:bg-muted/50",
                isDragging && "z-50 opacity-50"
            )}
        >
            <button
                aria-label="Drag to reorder"
                className="flex shrink-0 cursor-grab touch-none items-center text-muted-foreground opacity-0 transition-opacity group-hover/row:opacity-100 active:cursor-grabbing"
                {...attributes}
                {...listeners}
            >
                <GripVertical className="size-3.5" />
            </button>

            <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                {index + 1}
            </div>

            <PlaceAvatar place={place} size={28} />

            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                    <span className="truncate text-xs font-medium">
                        {place.name}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {place.placeTime && (
                        <span className="flex items-center gap-0.5">
                            <Clock className="size-2.5" />
                            {format(
                                new Date(place.placeTime),
                                timeFormat === "12h" ? "h:mm a" : "HH:mm"
                            )}
                            {place.endTime &&
                                ` – ${format(new Date(place.endTime), timeFormat === "12h" ? "h:mm a" : "HH:mm")}`}
                        </span>
                    )}
                </div>
            </div>

            {onRemove && (
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remove place"
                    className="size-6 shrink-0 opacity-0 transition-opacity group-hover/row:opacity-100"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove(place._id);
                    }}
                >
                    <Trash2 className="size-3 text-destructive" />
                </Button>
            )}
        </div>
    );
}
