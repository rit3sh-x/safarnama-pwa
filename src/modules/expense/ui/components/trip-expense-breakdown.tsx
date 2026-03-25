import { motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { ChevronRightIcon } from "lucide-react";
import { cn, stringToHex, getInitials } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { TripExpense } from "../../types";
import type { Id } from "@backend/dataModel";

interface TripExpenseBreakdownProps {
    trips: TripExpense[];
    isLoading: boolean;
}

export function TripExpenseBreakdown({
    trips,
    isLoading,
}: TripExpenseBreakdownProps) {
    const navigate = useNavigate();

    if (isLoading) {
        return (
            <div className="space-y-3">
                <h3 className="text-sm font-semibold">By Trip</h3>
                {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                        <Skeleton className="size-9 rounded-full" />
                        <div className="flex-1 space-y-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-2 w-full rounded-full" />
                        </div>
                        <Skeleton className="h-4 w-16" />
                    </div>
                ))}
            </div>
        );
    }

    if (trips.length === 0) return null;

    const maxExpense = Math.max(...trips.map((t) => t.totalExpenses), 1);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-3"
        >
            <h3 className="text-sm font-semibold">By Trip</h3>
            <div className="space-y-2">
                {trips.map((trip) => {
                    const { bg: bgColor, text: textColor } = stringToHex(
                        trip.tripId
                    );
                    const barWidth = (trip.totalExpenses / maxExpense) * 100;

                    return (
                        <button
                            key={trip.tripId}
                            onClick={() =>
                                navigate({
                                    to: "/trips/$tripId/expenses",
                                    params: {
                                        tripId: trip.tripId as Id<"trip">,
                                    },
                                })
                            }
                            className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-muted/50 active:bg-muted"
                        >
                            <div
                                className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                                style={{
                                    backgroundColor: bgColor,
                                    color: textColor,
                                }}
                            >
                                {getInitials(trip.tripTitle)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between">
                                    <span className="truncate text-sm font-medium">
                                        {trip.tripTitle}
                                    </span>
                                    <span className="ml-2 shrink-0 text-sm font-medium">
                                        ₹{trip.totalExpenses.toLocaleString()}
                                    </span>
                                </div>
                                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full rounded-full bg-primary/60 transition-all"
                                        style={{ width: `${barWidth}%` }}
                                    />
                                </div>
                                <p
                                    className={cn(
                                        "mt-1 text-xs",
                                        trip.userBalance >= 0
                                            ? "text-green-600 dark:text-green-400"
                                            : "text-red-500"
                                    )}
                                >
                                    {trip.userBalance >= 0
                                        ? `+₹${trip.userBalance.toLocaleString()} owed to you`
                                        : `-₹${Math.abs(trip.userBalance).toLocaleString()} you owe`}
                                </p>
                            </div>
                            <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
                        </button>
                    );
                })}
            </div>
        </motion.div>
    );
}
