import { useMemo, useState } from "react";
import { DraggablePlaceRow } from "./draggable-place-row";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Doc, Id } from "@backend/dataModel";

type FilterMode = "unassigned" | "all";

interface PlacesAccordionSectionProps {
    places: Doc<"place">[];
    selectedPlaceId: Id<"place"> | null;
    onSelectPlace: (placeId: Id<"place">) => void;
    onDeletePlace: (placeId: Id<"place">) => void;
    isMobile: boolean;
    className?: string;
}

export function PlacesAccordionSection({
    places,
    selectedPlaceId,
    onSelectPlace,
    onDeletePlace,
    isMobile,
    className,
}: PlacesAccordionSectionProps) {
    const [filter, setFilter] = useState<FilterMode>("unassigned");

    const visible = useMemo(() => {
        const sorted = [...places].sort((a, b) => a.name.localeCompare(b.name));
        if (filter === "unassigned") return sorted.filter((p) => !p.dayId);
        return sorted;
    }, [places, filter]);

    return (
        <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
            <div
                role="group"
                aria-label="Places filter"
                className="flex shrink-0 gap-1 border-b px-3 py-1.5"
            >
                <FilterTab
                    active={filter === "unassigned"}
                    onClick={() => setFilter("unassigned")}
                >
                    Unassigned
                </FilterTab>
                <FilterTab
                    active={filter === "all"}
                    onClick={() => setFilter("all")}
                >
                    All
                </FilterTab>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-1">
                {visible.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-2 px-4 py-8 text-center">
                        {filter === "unassigned" ? (
                            <>
                                <p className="text-xs text-muted-foreground">
                                    All places are assigned — nice work.
                                </p>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setFilter("all")}
                                >
                                    Show all places
                                </Button>
                            </>
                        ) : (
                            <p className="text-xs text-muted-foreground">
                                No places yet. Tap the map or use the pin button
                                to add one.
                            </p>
                        )}
                    </div>
                ) : (
                    visible.map((place) => (
                        <DraggablePlaceRow
                            key={place._id}
                            place={place}
                            isSelected={place._id === selectedPlaceId}
                            onSelect={onSelectPlace}
                            onRemove={onDeletePlace}
                            disabled={isMobile}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

function FilterTab({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "rounded-md px-2.5 py-1 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                active
                    ? "bg-primary/10 font-semibold text-primary"
                    : "text-muted-foreground hover:bg-muted/60"
            )}
        >
            {children}
        </button>
    );
}
