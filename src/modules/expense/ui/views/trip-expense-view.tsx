import { useState, useMemo } from "react";
import { useAtomValue } from "jotai";
import { useTour } from "@/hooks/use-tour";
import { ArrowLeft, Plus, Receipt } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InfiniteScrollTrigger } from "@/components/infinite-scroll-trigger";
import { selectedTripAtom } from "@/modules/trips/atoms";
import { useAuthenticatedUser } from "@/modules/auth/hooks/use-authentication";
import {
    useExpenses,
    useBalances,
    useRemoveExpense,
    useSettlements,
} from "../../hooks/use-expenses";
import { useTripMembers } from "../../hooks/use-trip-members";
import { ExpenseListItem } from "../components/expense-list-item";
import {
    BalanceSummary,
    BalanceSummarySkeleton,
} from "../components/balance-summary";
import { AddExpensePanel } from "../components/add-expense-panel";
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
    const { balances, isLoading: isBalancesLoading } = useBalances(tripId);
    const { settlements } = useSettlements(tripId);
    const { members } = useTripMembers(tripId);

    const { mutate: removeExpense } = useRemoveExpense();
    const [showAddExpense, setShowAddExpense] = useState(false);
    const [settleTarget, setSettleTarget] = useState<{
        toUserId: string;
        amount: number;
        expenseId?: Id<"expense">;
        expenseTitle?: string;
    } | null>(null);

    const currentUserId = user._id;

    const tourSteps = useMemo(
        () => [
            {
                element: '[data-tour="expense-balances"]',
                popover: {
                    title: "Balances",
                    description:
                        "See who owes whom. Tap a balance to settle up.",
                },
            },
            {
                element: '[data-tour="expense-list"]',
                popover: {
                    title: "Expenses",
                    description:
                        "Every expense logged for this trip. Tap to edit.",
                },
            },
            {
                element: '[data-tour="expense-add"]',
                popover: {
                    title: "Add Expense",
                    description: "Log a new expense and split it with members.",
                },
            },
        ],
        []
    );
    useTour("expense", tourSteps);

    const userMap = useMemo(() => {
        const map = new Map<string, { name: string; username: string }>();
        for (const m of members)
            map.set(m.userId, { name: m.name, username: m.username });
        return map;
    }, [members]);

    const mySettledByExpense = useMemo(() => {
        const map = new Map<Id<"expense">, number>();
        if (!settlements) return map;
        for (const s of settlements) {
            if (s.expenseId && s.fromUserId === currentUserId) {
                map.set(s.expenseId, s.amount);
            }
        }
        return map;
    }, [settlements, currentUserId]);

    const getPaidByName = (userId: string) => {
        if (userId === currentUserId) return "You";
        return userMap.get(userId)?.name ?? "Unknown";
    };

    return (
        <div className="relative flex h-full flex-col overflow-hidden bg-background">
            <div className="hidden h-14 shrink-0 items-center border-b bg-card px-1 md:flex">
                <div className="flex items-center gap-2 px-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Go back"
                        className="size-10"
                        onClick={onBack ?? (() => router.history.back())}
                    >
                        <ArrowLeft className="size-5" />
                    </Button>
                    <span className="text-base font-semibold">
                        {selectedTrip?.name ?? "Expenses"}
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div data-tour="expense-balances" className="border-b">
                    <div className="px-4 pt-4 pb-1">
                        <h2 className="text-sm font-semibold text-muted-foreground">
                            Balances
                        </h2>
                    </div>
                    {isBalancesLoading ? (
                        <BalanceSummarySkeleton />
                    ) : (
                        balances && (
                            <BalanceSummary
                                simplified={balances.simplified}
                                userMap={userMap}
                                currentUserId={currentUserId}
                                onSettleUp={(to, amount) =>
                                    setSettleTarget({ toUserId: to, amount })
                                }
                            />
                        )
                    )}
                </div>

                <div data-tour="expense-list">
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

                    {expenses.map((expense) => {
                        const settledAmount = mySettledByExpense.get(
                            expense._id
                        );
                        const isSettledByMe = settledAmount !== undefined;
                        return (
                            <ExpenseListItem
                                key={expense._id}
                                expenseId={expense._id}
                                title={expense.title}
                                amount={expense.amount}
                                paidBy={expense.paidBy}
                                paidByName={getPaidByName(expense.paidBy)}
                                date={expense.date}
                                notes={expense.notes}
                                canEdit
                                owedAmount={
                                    expense.paidBy !== currentUserId
                                        ? expense.amount / (members.length || 1)
                                        : undefined
                                }
                                isSettledByMe={isSettledByMe}
                                settledAmount={settledAmount}
                                onDelete={(id) =>
                                    removeExpense({ expenseId: id })
                                }
                                onSettle={(expenseId, toUserId, amt, title) =>
                                    setSettleTarget({
                                        toUserId,
                                        amount: amt,
                                        expenseId,
                                        expenseTitle: title,
                                    })
                                }
                            />
                        );
                    })}

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
                    data-tour="expense-add"
                    size="lg"
                    className="pointer-events-auto gap-2 rounded-full shadow-lg"
                    onClick={() => setShowAddExpense(true)}
                >
                    <Plus className="size-5" />
                    Add Expense
                </Button>
            </div>

            <AddExpensePanel
                open={showAddExpense}
                onClose={() => setShowAddExpense(false)}
                tripId={tripId}
                members={members}
                currentUserId={currentUserId}
            />

            {settleTarget?.toUserId && (
                <SettleUpModal
                    open={!!settleTarget}
                    onOpenChange={(open) => {
                        if (!open) setSettleTarget(null);
                    }}
                    tripId={tripId}
                    toUserId={settleTarget.toUserId}
                    toUsername={
                        userMap.get(settleTarget.toUserId)?.username ?? ""
                    }
                    amount={settleTarget.amount}
                    expenseId={settleTarget.expenseId}
                    expenseTitle={settleTarget.expenseTitle}
                />
            )}
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
