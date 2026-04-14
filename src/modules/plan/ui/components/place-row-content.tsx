import { forwardRef } from "react";
import { GripVertical, Clock, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { PlaceAvatar } from "./place-avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSettings } from "@/modules/settings/hooks/use-settings";
import type { Doc, Id } from "@backend/dataModel";

export interface PlaceRowContentProps {
    place: Doc<"place">;
    index?: number;
    isSelected: boolean;
    isDragging?: boolean;
    onSelect: (placeId: Id<"place">) => void;
    onRemove?: (placeId: Id<"place">) => void;
    dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
    dragHandleLabel?: string;
    style?: React.CSSProperties;
    className?: string;
}

export const PlaceRowContent = forwardRef<HTMLDivElement, PlaceRowContentProps>(
    function PlaceRowContent(
        {
            place,
            index,
            isSelected,
            isDragging,
            onSelect,
            onRemove,
            dragHandleProps,
            dragHandleLabel = "Drag to reorder or assign",
            style,
            className,
        },
        ref
    ) {
        const { timeFormat } = useSettings();

        return (
            <div
                ref={ref}
                style={style}
                onClick={() => onSelect(place._id)}
                className={cn(
                    "group/row flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors",
                    isSelected ? "bg-primary/10" : "hover:bg-muted/50",
                    isDragging && "z-50 opacity-50",
                    className
                )}
            >
                <button
                    aria-label={dragHandleLabel}
                    className="flex shrink-0 cursor-grab touch-none items-center text-muted-foreground opacity-0 transition-opacity group-hover/row:opacity-100 active:cursor-grabbing"
                    {...dragHandleProps}
                >
                    <GripVertical className="size-3.5" />
                </button>

                {index !== undefined && (
                    <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                        {index + 1}
                    </div>
                )}

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
);
