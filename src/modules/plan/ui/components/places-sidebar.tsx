import { useState, useMemo } from "react";
import { Search, Plus, X, Trash2, Navigation } from "lucide-react";
import { PlaceAvatar } from "./place-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Credenza,
    CredenzaContent,
    CredenzaHeader,
    CredenzaTitle,
    CredenzaBody,
} from "@/components/ui/credenza";
import { cn } from "@/lib/utils";
import type { Doc, Id } from "@backend/dataModel";

interface PlacesSidebarProps {
    places: Doc<"place">[];
    days: Doc<"day">[];
    selectedDayId: Id<"day"> | null;
    selectedPlaceId: Id<"place"> | null;
    isMobile?: boolean;
    onSelectPlace: (placeId: Id<"place"> | null) => void;
    onAddPlace: () => void;
    onDeletePlace?: (placeId: Id<"place">) => void;
    onAssignToDay?: (placeId: Id<"place">, dayId: Id<"day">) => void;
    className?: string;
}

export function PlacesSidebar({
    places,
    days,
    selectedDayId,
    selectedPlaceId,
    isMobile = false,
    onSelectPlace,
    onAddPlace,
    onDeletePlace,
    onAssignToDay,
    className,
}: PlacesSidebarProps) {
    const [search, setSearch] = useState("");
    const [dayPickerPlace, setDayPickerPlace] = useState<Doc<"place"> | null>(
        null
    );

    const filtered = useMemo(() => {
        const s = search.toLowerCase();
        return places.filter((p) => {
            if (
                s &&
                !p.name.toLowerCase().includes(s) &&
                !(p.address ?? "").toLowerCase().includes(s)
            )
                return false;
            return true;
        });
    }, [places, search]);

    const handlePlaceClick = (place: Doc<"place">) => {
        if (isMobile && days.length > 0) {
            setDayPickerPlace(place);
        } else {
            onSelectPlace(place._id === selectedPlaceId ? null : place._id);
        }
    };

    return (
        <div
            className={cn(
                "pointer-events-auto flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-xl",
                className
            )}
        >
            <div className="shrink-0 space-y-2.5 border-b p-3">
                <Button
                    className="w-full gap-1.5"
                    size="sm"
                    onClick={onAddPlace}
                >
                    <Plus className="size-3.5" />
                    Add place
                </Button>

                <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search places..."
                        className="h-8 pr-8 pl-8 text-xs"
                    />
                    {search && (
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Clear search"
                            className="absolute top-1/2 right-1 size-6 -translate-y-1/2"
                            onClick={() => setSearch("")}
                        >
                            <X className="size-3 text-muted-foreground" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="shrink-0 px-3 py-1.5">
                <span className="text-xs text-muted-foreground">
                    {filtered.length}{" "}
                    {filtered.length === 1 ? "place" : "places"}
                </span>
            </div>

            <ScrollArea className="min-h-0 flex-1">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                        <p className="text-xs text-muted-foreground">
                            No places found
                        </p>
                        <Button
                            variant="link"
                            size="sm"
                            className="text-xs"
                            onClick={onAddPlace}
                        >
                            Add a place
                        </Button>
                    </div>
                ) : (
                    filtered.map((place) => (
                        <PlaceListItem
                            key={place._id}
                            place={place}
                            isSelected={place._id === selectedPlaceId}
                            showAssignButton={
                                !!selectedDayId && !!onAssignToDay
                            }
                            onClick={() => handlePlaceClick(place)}
                            onAssign={() =>
                                selectedDayId &&
                                onAssignToDay?.(place._id, selectedDayId)
                            }
                            onDelete={
                                onDeletePlace
                                    ? () => onDeletePlace(place._id)
                                    : undefined
                            }
                        />
                    ))
                )}
            </ScrollArea>

            {dayPickerPlace && days.length > 0 && (
                <MobileDayPicker
                    place={dayPickerPlace}
                    days={days}
                    onAssign={(dayId) => {
                        onAssignToDay?.(dayPickerPlace._id, dayId);
                        setDayPickerPlace(null);
                    }}
                    onClose={() => setDayPickerPlace(null)}
                />
            )}
        </div>
    );
}

function PlaceListItem({
    place,
    isSelected,
    showAssignButton,
    onClick,
    onAssign,
    onDelete,
}: {
    place: Doc<"place">;
    isSelected: boolean;
    showAssignButton: boolean;
    onClick: () => void;
    onAssign: () => void;
    onDelete?: () => void;
}) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "group/item flex cursor-pointer items-center gap-2.5 border-b px-3 py-2 transition-colors",
                isSelected ? "bg-muted" : "hover:bg-muted/50"
            )}
        >
            <PlaceAvatar place={place} size={34} />

            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium">
                        {place.name}
                    </span>
                </div>
                {(place.description || place.address) && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {place.description || place.address}
                    </p>
                )}
            </div>

            <div className="flex shrink-0 items-center gap-1">
                {showAssignButton && (
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Assign to day"
                        className="size-5 opacity-0 transition-opacity group-hover/item:opacity-100"
                        onClick={(e) => {
                            e.stopPropagation();
                            onAssign();
                        }}
                    >
                        <Plus className="size-3" />
                    </Button>
                )}

                {place.lat != null && place.lng != null && (
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Open in Google Maps"
                        className="size-5 opacity-0 transition-opacity group-hover/item:opacity-100"
                        onClick={(e) => {
                            e.stopPropagation();
                            window.open(
                                `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`,
                                "_blank"
                            );
                        }}
                    >
                        <Navigation className="size-3" />
                    </Button>
                )}

                {onDelete && (
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete place"
                        className="size-5 opacity-0 transition-opacity group-hover/item:opacity-100"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                    >
                        <Trash2 className="size-3 text-destructive" />
                    </Button>
                )}
            </div>
        </div>
    );
}

function MobileDayPicker({
    place,
    days,
    onAssign,
    onClose,
}: {
    place: Doc<"place">;
    days: Doc<"day">[];
    onAssign: (dayId: Id<"day">) => void;
    onClose: () => void;
}) {
    return (
        <Credenza open onOpenChange={(open) => !open && onClose()}>
            <CredenzaContent>
                <CredenzaHeader>
                    <CredenzaTitle>{place.name}</CredenzaTitle>
                </CredenzaHeader>
                <CredenzaBody className="pb-6">
                    <p className="mb-3 text-xs text-muted-foreground">
                        Assign to a day
                    </p>
                    <div className="space-y-1">
                        {days
                            .sort((a, b) => a.dayNumber - b.dayNumber)
                            .map((day, i) => (
                                <Button
                                    key={day._id}
                                    variant="ghost"
                                    className="flex w-full items-center justify-start gap-3 rounded-xl p-3"
                                    onClick={() => onAssign(day._id)}
                                >
                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                                        {i + 1}
                                    </div>
                                    <div className="min-w-0 flex-1 text-left">
                                        <p className="text-sm font-semibold">
                                            {day.title || `Day ${i + 1}`}
                                        </p>
                                        {day.date && (
                                            <p className="text-xs text-muted-foreground">
                                                {day.date}
                                            </p>
                                        )}
                                    </div>
                                </Button>
                            ))}
                    </div>
                </CredenzaBody>
            </CredenzaContent>
        </Credenza>
    );
}
