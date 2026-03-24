import { WalletIcon } from "lucide-react";
import { useGlobalExpenseSummary } from "../../hooks/use-expenses";
import { GlobalBalanceCard } from "../components/global-balance-card";
import { SpendingChart } from "../components/spending-chart";
import { TripExpenseBreakdown } from "../components/trip-expense-breakdown";

export function ExpensesView() {
    const { summary, isLoading } = useGlobalExpenseSummary();

    return (
        <div className="flex h-full flex-col overflow-y-auto">
            <div className="mx-auto w-full max-w-4xl space-y-6 p-4 pb-8">
                <GlobalBalanceCard
                    totalOwed={summary?.totalOwed ?? 0}
                    totalOwing={summary?.totalOwing ?? 0}
                    isLoading={isLoading}
                />

                <SpendingChart
                    data={summary?.monthlySpending ?? []}
                    isLoading={isLoading}
                />

                <TripExpenseBreakdown
                    trips={summary?.perTrip ?? []}
                    isLoading={isLoading}
                />

                {!isLoading && (summary?.perTrip ?? []).length === 0 && (
                    <div className="flex flex-col items-center gap-3 py-16 text-center">
                        <WalletIcon className="size-10 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">
                            No expenses yet. Add expenses in your trips!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
