import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PlaceRowContent } from "./place-row-content";
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
        <PlaceRowContent
            ref={setNodeRef}
            place={place}
            index={index}
            isSelected={isSelected}
            isDragging={isDragging}
            onSelect={onSelect}
            onRemove={onRemove}
            dragHandleProps={{ ...attributes, ...listeners }}
            dragHandleLabel="Drag to reorder"
            style={style}
        />
    );
}
