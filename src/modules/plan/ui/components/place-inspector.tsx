import { useState, useRef } from "react";
import {
    X,
    Clock,
    MapPin,
    Edit2,
    Trash2,
    Plus,
    Minus,
    Navigation,
} from "lucide-react";
import { PlaceAvatar } from "./place-avatar";
import { WeatherWidget } from "./weather-widget";
import { useSettings } from "@/modules/settings/hooks/use-settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Doc, Id } from "@backend/dataModel";

interface PlaceInspectorProps {
    place: Doc<"place"> | null;
    day?: Doc<"day"> | null;
    isAssignedToDay?: boolean;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onAssignToDay?: (placeId: Id<"place">) => void;
    onRemoveFromDay?: (placeId: Id<"place">) => void;
    onUpdatePlace?: (placeId: Id<"place">, data: Partial<Doc<"place">>) => void;
}

function formatTime(timestamp: number | undefined, timeFormat: string) {
    if (!timestamp) return "";
    return format(
        new Date(timestamp),
        timeFormat === "12h" ? "h:mm a" : "HH:mm"
    );
}

export function PlaceInspector({
    place,
    day,
    isAssignedToDay = false,
    onClose,
    onEdit,
    onDelete,
    onAssignToDay,
    onRemoveFromDay,
    onUpdatePlace,
}: PlaceInspectorProps) {
    const { timeFormat } = useSettings();
    const [editingName, setEditingName] = useState(false);
    const [nameValue, setNameValue] = useState("");
    const nameInputRef = useRef<HTMLInputElement>(null);

    if (!place) return null;

    const startNameEdit = () => {
        if (!onUpdatePlace) return;
        setNameValue(place.name);
        setEditingName(true);
        setTimeout(() => nameInputRef.current?.focus(), 0);
    };

    const commitNameEdit = () => {
        if (!editingName) return;
        const trimmed = nameValue.trim();
        setEditingName(false);
        if (!trimmed || trimmed === place.name) return;
        onUpdatePlace?.(place._id, { name: trimmed });
    };

    const handleNameKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            commitNameEdit();
        }
        if (e.key === "Escape") setEditingName(false);
    };

    return (
        <div className="absolute bottom-5 left-1/2 z-50 w-[min(800px,calc(100vw-32px))] -translate-x-1/2">
            <Card className="overflow-hidden p-0 shadow-lg">
                <CardContent className="flex flex-col p-0">
                    <div className="flex items-center gap-3 border-b p-4">
                        <PlaceAvatar place={place} size={48} />

                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                {editingName ? (
                                    <Input
                                        ref={nameInputRef}
                                        value={nameValue}
                                        onChange={(e) =>
                                            setNameValue(e.target.value)
                                        }
                                        onBlur={commitNameEdit}
                                        onKeyDown={handleNameKeyDown}
                                        className="h-7 text-sm font-semibold"
                                    />
                                ) : (
                                    <span
                                        onDoubleClick={startNameEdit}
                                        className={cn(
                                            "text-sm font-semibold",
                                            onUpdatePlace && "cursor-text"
                                        )}
                                    >
                                        {place.name}
                                    </span>
                                )}
                            </div>

                            {place.address && (
                                <div className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
                                    <MapPin className="mt-0.5 size-3 shrink-0" />
                                    <span className="line-clamp-2">
                                        {place.address}
                                    </span>
                                </div>
                            )}

                            {place.placeTime && (
                                <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="size-2.5 shrink-0" />
                                    <span>
                                        {formatTime(
                                            place.placeTime,
                                            timeFormat
                                        )}
                                        {place.endTime &&
                                            ` – ${formatTime(place.endTime, timeFormat)}`}
                                    </span>
                                </div>
                            )}

                            {place.lat != null && place.lng != null && (
                                <p className="mt-1 hidden text-xs text-muted-foreground tabular-nums sm:block">
                                    {place.lat.toFixed(6)},{" "}
                                    {place.lng.toFixed(6)}
                                </p>
                            )}
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Close"
                            className="size-7 shrink-0 self-start rounded-full"
                            onClick={onClose}
                        >
                            <X className="size-3.5" />
                        </Button>
                    </div>

                    <div className="space-y-3 overflow-y-auto p-4">
                        {place.description && (
                            <div className="rounded-lg bg-muted/50 p-3">
                                <p className="text-xs leading-relaxed text-muted-foreground">
                                    {place.description}
                                </p>
                            </div>
                        )}

                        {place.lat != null &&
                            place.lng != null &&
                            place.placeTime && (
                                <div className="rounded-lg border p-3">
                                    <WeatherWidget
                                        key={`${place.lat}_${place.lng}_${place.placeTime}`}
                                        lat={place.lat}
                                        lng={place.lng}
                                        date={new Date(place.placeTime)
                                            .toISOString()
                                            .slice(0, 10)}
                                    />
                                </div>
                            )}
                    </div>

                    <Separator />

                    <div className="flex flex-wrap items-center gap-2 p-3">
                        {day &&
                            onAssignToDay &&
                            onRemoveFromDay &&
                            (isAssignedToDay ? (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="gap-1.5 text-xs"
                                    onClick={() => onRemoveFromDay(place._id)}
                                >
                                    <Minus className="size-3" />
                                    <span className="hidden sm:inline">
                                        Remove from day
                                    </span>
                                    <span className="sm:hidden">Remove</span>
                                </Button>
                            ) : (
                                <Button
                                    size="sm"
                                    className="gap-1.5 text-xs"
                                    onClick={() => onAssignToDay(place._id)}
                                >
                                    <Plus className="size-3" />
                                    Add to day
                                </Button>
                            ))}

                        {place.lat != null && place.lng != null && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1.5 text-xs"
                                onClick={() =>
                                    window.open(
                                        `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`,
                                        "_blank"
                                    )
                                }
                            >
                                <Navigation className="size-3" />
                                <span className="hidden sm:inline">
                                    Google Maps
                                </span>
                            </Button>
                        )}

                        <div className="flex-1" />

                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-xs"
                            onClick={onEdit}
                        >
                            <Edit2 className="size-3" />
                            <span className="hidden sm:inline">Edit</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-xs text-destructive hover:text-destructive"
                            onClick={onDelete}
                        >
                            <Trash2 className="size-3" />
                            <span className="hidden sm:inline">Delete</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
