import { motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { MapPinIcon, CalendarIcon } from "lucide-react";
import { stringToHex, getInitials } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { UpcomingTrip } from "../../types";
import { differenceInCalendarDays } from "date-fns";

interface DashboardUpcomingTripsProps {
    trips: UpcomingTrip[];
    isLoading: boolean;
}

function daysUntil(timestamp: number): number {
    return Math.max(
        0,
        differenceInCalendarDays(new Date(timestamp), new Date())
    );
}

export function DashboardUpcomingTrips({
    trips,
    isLoading,
}: DashboardUpcomingTripsProps) {
    const navigate = useNavigate();

    if (isLoading) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 0.5,
                    delay: 0.2,
                    ease: [0.16, 1, 0.3, 1],
                }}
                className="space-y-3"
            >
                <h2 className="text-base font-semibold">Upcoming Trips</h2>
                <div className="flex gap-3 overflow-x-auto pb-1">
                    {[0, 1].map((i) => (
                        <Skeleton
                            key={i}
                            className="h-24 w-48 shrink-0 rounded-xl"
                        />
                    ))}
                </div>
            </motion.div>
        );
    }

    if (trips.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-3"
        >
            <h2 className="text-base font-semibold">Upcoming Trips</h2>
            <div className="scrollbar-none flex gap-3 overflow-x-auto pb-1">
                {trips.map((trip) => {
                    const days = daysUntil(trip.startDate);
                    const { bg: bgColor, text: textColor } = stringToHex(
                        trip.tripId
                    );

                    return (
                        <button
                            key={trip.tripId}
                            onClick={() =>
                                navigate({
                                    to: "/trips/$tripId/chat",
                                    params: { tripId: trip.tripId },
                                })
                            }
                            className="flex w-48 shrink-0 flex-col gap-2 rounded-xl border border-border p-3 text-left transition-colors hover:bg-muted/50 active:bg-muted"
                        >
                            <div className="flex items-center gap-2">
                                <div
                                    className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                                    style={{
                                        backgroundColor: bgColor,
                                        color: textColor,
                                    }}
                                >
                                    {trip.logo ? (
                                        <img
                                            src={trip.logo}
                                            alt={trip.title}
                                            className="size-full rounded-full object-cover"
                                        />
                                    ) : (
                                        getInitials(trip.title)
                                    )}
                                </div>
                                <span className="truncate text-sm font-medium">
                                    {trip.title}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPinIcon className="size-3" />
                                <span className="truncate">
                                    {trip.destination}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs font-medium text-primary">
                                <CalendarIcon className="size-3" />
                                {days === 0
                                    ? "Today!"
                                    : `In ${days} day${days !== 1 ? "s" : ""}`}
                            </div>
                        </button>
                    );
                })}
            </div>
        </motion.div>
    );
}
