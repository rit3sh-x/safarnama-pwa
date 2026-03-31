import { format } from "date-fns";
import { MapIcon } from "lucide-react";
import type { Doc } from "@backend/dataModel";

interface SidebarHeaderProps {
    trip: Doc<"trip">;
    dayCount: number;
    totalPlaces: number;
}

export function SidebarHeader({
    trip,
    dayCount,
    totalPlaces,
}: SidebarHeaderProps) {
    const startStr = trip.startDate
        ? format(new Date(trip.startDate), "MMM d")
        : null;
    const endStr = trip.endDate
        ? format(new Date(trip.endDate), "MMM d")
        : null;
    const dateRange = [startStr, endStr].filter(Boolean).join(" – ");

    return (
        <div className="shrink-0 border-b p-4">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <h2 className="truncate text-sm font-semibold">
                        {trip.title}
                    </h2>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                        {dateRange && <span>{dateRange}</span>}
                        {dayCount > 0 && (
                            <span>
                                {dayCount} {dayCount === 1 ? "day" : "days"}
                            </span>
                        )}
                        {totalPlaces > 0 && (
                            <span>
                                {totalPlaces}{" "}
                                {totalPlaces === 1 ? "place" : "places"}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <MapIcon className="size-4" />
                </div>
            </div>
        </div>
    );
}
