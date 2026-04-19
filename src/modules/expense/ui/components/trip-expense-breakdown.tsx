import { motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { cn, stringToHex, getInitials } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { TripExpense } from "../../types";
import type { Id } from "@backend/dataModel";

interface TripExpenseBreakdownProps {
    trips: TripExpense[];
    isLoading: boolean;
}

const EASE = [0.16, 1, 0.3, 1] as const;

export function TripExpenseBreakdown({
    trips,
    isLoading,
}: TripExpenseBreakdownProps) {
    const navigate = useNavigate();

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="flex items-baseline justify-between">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-16" />
                </div>
                {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-3 py-3">
                        <Skeleton className="size-10 rounded-xl" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-1 w-full rounded-full" />
                        </div>
                        <Skeleton className="h-5 w-20" />
                    </div>
                ))}
            </div>
        );
    }

    if (trips.length === 0) return null;

    const grandTotal = trips.reduce((sum, t) => sum + t.totalExpenses, 0);
    const maxExpense = Math.max(...trips.map((t) => t.totalExpenses), 1);

    return (
        <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.24, ease: EASE }}
            className="space-y-2"
        >
            <header className="flex items-baseline justify-between pb-1">
                <p className="text-[10px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
                    By Trip
                </p>
                <p className="text-xs text-muted-foreground tabular-nums">
                    {trips.length} trip{trips.length === 1 ? "" : "s"}
                    <span className="mx-2 opacity-40">·</span>₹
                    {grandTotal.toLocaleString("en-IN")}
                </p>
            </header>

            <ul className="divide-y divide-border/60 rounded-2xl border bg-card">
                {trips.map((trip, idx) => {
                    const { bg, text } = stringToHex(trip.tripId);
                    const pct = (trip.totalExpenses / maxExpense) * 100;
                    const share =
                        grandTotal > 0
                            ? Math.round(
                                  (trip.totalExpenses / grandTotal) * 100
                              )
                            : 0;
                    const positive = trip.userBalance > 0;
                    const negative = trip.userBalance < 0;

                    return (
                        <li key={trip.tripId}>
                            <button
                                onClick={() =>
                                    navigate({
                                        to: "/trips/$tripId/expenses",
                                        params: {
                                            tripId: trip.tripId as Id<"trip">,
                                        },
                                    })
                                }
                                className="group flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-muted/40"
                            >
                                <span className="w-4 shrink-0 text-[11px] font-medium tracking-wider text-muted-foreground tabular-nums">
                                    {String(idx + 1).padStart(2, "0")}
                                </span>

                                <div
                                    className="flex size-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold"
                                    style={{
                                        backgroundColor: bg,
                                        color: text,
                                    }}
                                >
                                    {getInitials(trip.tripTitle)}
                                </div>

                                <div className="min-w-0 flex-1 space-y-1.5">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="truncate text-sm font-medium">
                                            {trip.tripTitle}
                                        </span>
                                        <span className="shrink-0 text-sm font-semibold tabular-nums">
                                            ₹
                                            {trip.totalExpenses.toLocaleString(
                                                "en-IN"
                                            )}
                                        </span>
                                    </div>

                                    <div className="relative h-1 w-full overflow-hidden rounded-full bg-muted">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pct}%` }}
                                            transition={{
                                                duration: 0.8,
                                                delay: 0.3 + idx * 0.05,
                                                ease: EASE,
                                            }}
                                            className="h-full rounded-full bg-primary"
                                        />
                                    </div>

                                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground tabular-nums">
                                        <span>{share}% of total</span>
                                        <span className="opacity-40">·</span>
                                        <span>
                                            {trip.expenseCount} expense
                                            {trip.expenseCount === 1 ? "" : "s"}
                                        </span>
                                        {(positive || negative) && (
                                            <>
                                                <span className="opacity-40">
                                                    ·
                                                </span>
                                                <span
                                                    className={cn(
                                                        "font-medium",
                                                        positive &&
                                                            "text-emerald-600 dark:text-emerald-400",
                                                        negative &&
                                                            "text-destructive"
                                                    )}
                                                >
                                                    {positive ? "+" : "−"}₹
                                                    {Math.abs(
                                                        trip.userBalance
                                                    ).toLocaleString("en-IN")}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </motion.section>
    );
}
