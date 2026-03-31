import { X, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { WeatherWidget } from "./weather-widget";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Doc } from "@backend/dataModel";

interface DayDetailPanelProps {
    day: Doc<"day">;
    dayIndex: number;
    placeCount: number;
    lat?: number | null;
    lng?: number | null;
    onClose: () => void;
}

export function DayDetailPanel({
    day,
    dayIndex,
    placeCount,
    lat,
    lng,
    onClose,
}: DayDetailPanelProps) {
    const displayTitle = day.title || `Day ${dayIndex + 1}`;
    const formattedDate = day.date
        ? format(new Date(day.date), "EEEE, MMMM d")
        : null;

    return (
        <div className="absolute bottom-5 left-1/2 z-50 w-[min(700px,calc(100vw-32px))] -translate-x-1/2">
            <Card className="overflow-hidden shadow-lg">
                <CardContent className="flex max-h-[50vh] flex-col p-0">
                    <div className="flex items-center gap-3 border-b p-4">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted">
                            <CalendarDays className="size-5 text-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="text-[15px] font-bold">
                                {displayTitle}
                            </h3>
                            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                                {formattedDate && <span>{formattedDate}</span>}
                                {placeCount > 0 && (
                                    <span>
                                        {placeCount}{" "}
                                        {placeCount === 1 ? "place" : "places"}
                                    </span>
                                )}
                            </div>
                        </div>
                        <Button
                            variant="secondary"
                            size="icon"
                            aria-label="Close"
                            className="size-8 shrink-0 rounded-lg"
                            onClick={onClose}
                        >
                            <X className="size-3.5 text-muted-foreground" />
                        </Button>
                    </div>

                    {day.date && lat != null && lng != null ? (
                        <div className="overflow-y-auto p-4">
                            <WeatherWidget
                                key={`${lat}_${lng}_${day.date}`}
                                lat={lat}
                                lng={lng}
                                date={day.date}
                            />
                        </div>
                    ) : (
                        <div className="p-4">
                            <p className="text-center text-xs text-muted-foreground">
                                Add places with coordinates to see weather
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
