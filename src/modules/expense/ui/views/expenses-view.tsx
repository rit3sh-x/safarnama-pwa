import { useMemo } from "react";
import { motion } from "framer-motion";
import { WalletIcon } from "lucide-react";
import { useGlobalExpenseSummary } from "../../hooks/use-expenses";
import { useTour } from "@/hooks/use-tour";
import { ExpenseHero } from "../components/expense-hero";
import { ExpenseStats } from "../components/expense-stats";
import { SpendingChart } from "../components/spending-chart";
import { TripExpenseBreakdown } from "../components/trip-expense-breakdown";

const EASE = [0.16, 1, 0.3, 1] as const;

export function ExpensesView() {
    const { summary, isLoading } = useGlobalExpenseSummary();

    const hasData = !isLoading && (summary?.perTrip ?? []).length > 0;
    const showEmpty = !isLoading && !hasData;

    const tourSteps = useMemo(
        () => [
            {
                element: '[data-tour="exp-hero"]',
                popover: {
                    title: "Your Net Balance",
                    description:
                        "Net of what's owed to you minus what you owe, across every trip.",
                },
            },
            {
                element: '[data-tour="exp-stats"]',
                popover: {
                    title: "Stats at a glance",
                    description:
                        "Total paid, owed, owing, and trip count — all tabular for quick scanning.",
                },
            },
            {
                element: '[data-tour="exp-chart"]',
                popover: {
                    title: "Monthly Spending",
                    description:
                        "See trend over 1M / 3M / 6M / 1Y. Hover bars for exact amount.",
                },
            },
            {
                element: '[data-tour="exp-trips"]',
                popover: {
                    title: "By Trip",
                    description:
                        "Trips ranked by spend. Tap any trip to open its expenses.",
                },
            },
        ],
        []
    );
    useTour("expenses-global", tourSteps, hasData);

    return (
        <div className="h-full overflow-y-auto bg-background">
            <div className="mx-auto w-full max-w-5xl space-y-10 px-5 py-8 md:px-8 md:py-12">
                <div data-tour="exp-hero">
                    <ExpenseHero
                        totalOwed={summary?.totalOwed ?? 0}
                        totalOwing={summary?.totalOwing ?? 0}
                        thisMonthSpent={summary?.thisMonthSpent ?? 0}
                        lastMonthSpent={summary?.lastMonthSpent ?? 0}
                        isLoading={isLoading}
                    />
                </div>

                <div data-tour="exp-stats">
                    <ExpenseStats
                        totalSpent={summary?.totalSpent ?? 0}
                        totalOwed={summary?.totalOwed ?? 0}
                        totalOwing={summary?.totalOwing ?? 0}
                        expenseCount={summary?.expenseCount ?? 0}
                        tripCount={summary?.tripCount ?? 0}
                        isLoading={isLoading}
                    />
                </div>

                <div data-tour="exp-chart">
                    <SpendingChart
                        data={summary?.monthlySpending ?? []}
                        isLoading={isLoading}
                    />
                </div>

                <div data-tour="exp-trips">
                    <TripExpenseBreakdown
                        trips={summary?.perTrip ?? []}
                        isLoading={isLoading}
                    />
                </div>

                {showEmpty && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: EASE }}
                        className="flex flex-col items-center gap-4 rounded-2xl border border-dashed py-20 text-center"
                    >
                        <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60">
                            <WalletIcon className="size-6 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium">
                                No expenses yet
                            </p>
                            <p className="max-w-xs text-xs text-muted-foreground">
                                Once you add expenses inside a trip, you'll see
                                your spending trends and balances here.
                            </p>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
