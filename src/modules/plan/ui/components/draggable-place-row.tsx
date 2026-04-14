import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { PlaceRowContent } from "./place-row-content";
import type { Doc, Id } from "@backend/dataModel";

interface DraggablePlaceRowProps {
    place: Doc<"place">;
    isSelected: boolean;
    onSelect: (placeId: Id<"place">) => void;
    onRemove?: (placeId: Id<"place">) => void;
    disabled?: boolean;
}

export function DraggablePlaceRow({
    place,
    isSelected,
    onSelect,
    onRemove,
    disabled = false,
}: DraggablePlaceRowProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } =
        useDraggable({
            id: `place-${place._id}`,
            data: { type: "place", placeId: place._id },
            disabled,
        });

    const style = transform
        ? { transform: CSS.Translate.toString(transform) }
        : undefined;

    return (
        <PlaceRowContent
            ref={setNodeRef}
            place={place}
            isSelected={isSelected}
            isDragging={isDragging}
            onSelect={onSelect}
            onRemove={onRemove}
            dragHandleProps={
                disabled ? undefined : { ...attributes, ...listeners }
            }
            dragHandleLabel="Drag to assign to a day"
            style={style}
        />
    );
}
