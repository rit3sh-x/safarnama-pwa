import { useState, useMemo } from "react";
import { useAtomValue } from "jotai";
import { ArrowLeft, Plus, HandCoins, Receipt } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InfiniteScrollTrigger } from "@/components/infinite-scroll-trigger";
import { selectedTripAtom } from "@/modules/trips/atoms";
import { useAuthenticatedUser } from "@/modules/auth/hooks/use-authentication";
import { useExpenses, useBalances } from "../../hooks/use-expenses";
import { useTripMembers } from "../../hooks/use-trip-members";
import { ExpenseListItem } from "../components/expense-list-item";
import {
    BalanceSummary,
    BalanceSummarySkeleton,
} from "../components/balance-summary";
import { AddExpenseModal } from "../components/add-expense-modal";
import { SettleUpModal } from "../components/settle-up-modal";
import type { Id } from "@backend/dataModel";

interface TripExpenseViewProps {
    tripId: Id<"trip">;
    onBack?: () => void;
}

export function TripExpenseView({ tripId, onBack }: TripExpenseViewProps) {
    const router = useRouter();
    const { user } = useAuthenticatedUser();
    const selectedTrip = useAtomValue(selectedTripAtom);
    const { expenses, isLoading, isDone, loadMore } = useExpenses(tripId);
    const { balances } = useBalances(tripId);
    const { members } = useTripMembers(tripId);

    const [showAddExpense, setShowAddExpense] = useState(false);
    const [showSettleUp, setShowSettleUp] = useState(false);

    const currentUserId = user._id;

    const userMap = useMemo(() => {
        const map = new Map<string, string>();
        for (const m of members) map.set(m.userId, `@${m.username}`);
        return map;
    }, [members]);

    const getPaidByName = (userId: string) => {
        if (userId === currentUserId) return "You";
        return userMap.get(userId) ?? "Unknown";
    };

    return (
        <div className="flex h-full flex-col overflow-hidden bg-background">
            <div className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-1 pr-3">
                <div className="flex items-center">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-10"
                        onClick={onBack ?? (() => router.history.back())}
                    >
                        <ArrowLeft className="size-5" />
                    </Button>
                    <span className="text-base font-semibold">
                        {selectedTrip?.name ?? "Expenses"}
                    </span>
                </div>

                <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => setShowSettleUp(true)}
                >
                    <HandCoins className="size-4" />
                    Settle Up
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="border-b">
                    <div className="px-4 pt-4 pb-1">
                        <h2 className="text-sm font-semibold text-muted-foreground">
                            Balances
                        </h2>
                    </div>
                    {!balances ? (
                        <BalanceSummarySkeleton />
                    ) : (
                        <BalanceSummary
                            simplified={balances.simplified}
                            userMap={userMap}
                            currentUserId={currentUserId}
                        />
                    )}
                </div>

                <div>
                    <div className="px-4 pt-4 pb-1">
                        <h2 className="text-sm font-semibold text-muted-foreground">
                            Expenses
                        </h2>
                    </div>

                    {isLoading && expenses.length === 0 && (
                        <ExpenseListSkeleton />
                    )}

                    {!isLoading && expenses.length === 0 && (
                        <div className="flex flex-col items-center gap-2 px-6 py-12">
                            <Receipt className="size-10 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                                No expenses yet. Add one to get started!
                            </p>
                        </div>
                    )}

                    {expenses.map((expense) => (
                        <ExpenseListItem
                            key={expense._id}
                            title={expense.title}
                            amount={expense.amount}
                            paidByName={getPaidByName(expense.paidBy)}
                            date={expense.date}
                        />
                    ))}

                    {!isDone && expenses.length > 0 && (
                        <InfiniteScrollTrigger
                            canLoadMore={!isDone}
                            isLoadingMore={isLoading}
                            onLoadMore={loadMore}
                            loadMoreText="Load more expenses"
                        />
                    )}
                </div>
            </div>

            <div className="pointer-events-none absolute right-4 bottom-6 z-20 flex justify-end md:right-8">
                <Button
                    size="lg"
                    className="pointer-events-auto gap-2 rounded-full shadow-lg"
                    onClick={() => setShowAddExpense(true)}
                >
                    <Plus className="size-5" />
                    Add Expense
                </Button>
            </div>

            <AddExpenseModal
                open={showAddExpense}
                onOpenChange={setShowAddExpense}
                tripId={tripId}
                members={members}
                currentUserId={currentUserId}
            />

            <SettleUpModal
                open={showSettleUp}
                onOpenChange={setShowSettleUp}
                tripId={tripId}
                members={members}
                currentUserId={currentUserId}
                simplified={balances?.simplified ?? []}
            />
        </div>
    );
}

function ExpenseListSkeleton() {
    return (
        <div className="space-y-1 py-2">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <Skeleton className="size-10 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-32" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                </div>
            ))}
        </div>
    );
}
