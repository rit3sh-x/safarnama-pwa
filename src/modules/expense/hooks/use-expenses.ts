import { PAGINATION } from "@/lib/constants";
import { api } from "@backend/api";
import { useMutation, usePaginatedQuery } from "convex/react";
import type { OptimisticLocalStore } from "convex/browser";
import { useQuery } from "convex-helpers/react/cache";
import type { FunctionArgs } from "convex/server";
import { useState } from "react";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import type { Id } from "@backend/dataModel";

function updateExpenseInStore(
    localStore: OptimisticLocalStore,
    expenseId: Id<"expense">,
    updater: (exp: Record<string, unknown>) => Record<string, unknown> | null
) {
    const allPages = localStore.getAllQueries(api.methods.expenses.list);
    for (const { args: queryArgs, value } of allPages) {
        if (!queryArgs || !value) continue;
        const page = value.page as Record<string, unknown>[];
        const idx = page.findIndex((e) => e._id === expenseId);
        if (idx === -1) continue;
        const result = updater(page[idx]);
        const updated = [...page];
        if (result === null) {
            updated.splice(idx, 1);
        } else {
            updated[idx] = result;
        }
        localStore.setQuery(api.methods.expenses.list, queryArgs, {
            ...value,
            page: updated,
        } as typeof value);
        break;
    }
}

export function useExpenses(tripId: Id<"trip"> | undefined) {
    const listQuery = api.methods.expenses.list as unknown as Parameters<
        typeof usePaginatedQuery
    >[0];
    const { results, status, loadMore } = usePaginatedQuery(
        listQuery,
        tripId ? { tripId } : "skip",
        { initialNumItems: PAGINATION.TRIPS_PAGE_SIZE }
    );

    return {
        expenses: results,
        isLoading: status === "LoadingFirstPage",
        isDone: status === "Exhausted",
        loadMore: () => loadMore(PAGINATION.TRIPS_PAGE_SIZE),
    };
}

export function useBalances(tripId: Id<"trip"> | undefined) {
    const data = useQuery(
        api.methods.expenses.balances,
        tripId ? { tripId } : "skip"
    );

    return {
        balances: data,
        isLoading: data === undefined,
    };
}

export function useSettlements(tripId: Id<"trip"> | undefined) {
    const data = useQuery(
        api.methods.expenses.listSettlements,
        tripId ? { tripId } : "skip"
    );

    return {
        settlements: data,
        isLoading: data === undefined,
    };
}

export const useCreateExpense = () => {
    const [isPending, setIsPending] = useState(false);
    const createExpense = useMutation(
        api.methods.expenses.create
    ).withOptimisticUpdate((localStore, args) => {
        const allPages = localStore.getAllQueries(api.methods.expenses.list);
        for (const { args: queryArgs, value } of allPages) {
            if (!queryArgs || !value || queryArgs.tripId !== args.tripId)
                continue;

            const optimisticExpense = {
                _id: nanoid(10) as Id<"expense">,
                _creationTime: Date.now(),
                tripId: args.tripId,
                title: args.title,
                amount: args.amount,
                paidBy: args.paidBy,
                date: args.date,
                notes: args.notes,
                receiptUrl: args.receiptUrl,
                splitType: args.splitType,
                updatedAt: Date.now(),
                _optimistic: true,
            };

            localStore.setQuery(api.methods.expenses.list, queryArgs, {
                ...value,
                page: [optimisticExpense, ...value.page],
            });
            break;
        }
    });

    const mutate = async (
        args: FunctionArgs<typeof api.methods.expenses.create>
    ) => {
        setIsPending(true);
        try {
            return await createExpense(args);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to create expense"
            );
        } finally {
            setIsPending(false);
        }
    };

    return { mutate, isPending };
};

export const useUpdateExpense = () => {
    const [isPending, setIsPending] = useState(false);
    const updateExpense = useMutation(
        api.methods.expenses.update
    ).withOptimisticUpdate((localStore, args) => {
        updateExpenseInStore(localStore, args.expenseId, (exp) => ({
            ...exp,
            ...(args.title !== undefined && { title: args.title }),
            ...(args.amount !== undefined && { amount: args.amount }),
            ...(args.date !== undefined && { date: args.date }),
            ...(args.notes !== undefined && { notes: args.notes }),
            ...(args.receiptUrl !== undefined && {
                receiptUrl: args.receiptUrl,
            }),
            updatedAt: Date.now(),
        }));
    });

    const mutate = async (
        args: FunctionArgs<typeof api.methods.expenses.update>
    ) => {
        setIsPending(true);
        try {
            await updateExpense(args);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to update expense"
            );
        } finally {
            setIsPending(false);
        }
    };

    return { mutate, isPending };
};

export const useRemoveExpense = () => {
    const [isPending, setIsPending] = useState(false);
    const removeExpense = useMutation(
        api.methods.expenses.remove
    ).withOptimisticUpdate((localStore, args) => {
        updateExpenseInStore(localStore, args.expenseId, () => null);
    });

    const mutate = async (
        args: FunctionArgs<typeof api.methods.expenses.remove>
    ) => {
        setIsPending(true);
        try {
            await removeExpense(args);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to remove expense"
            );
        } finally {
            setIsPending(false);
        }
    };

    return { mutate, isPending };
};

export const useSettleSplit = () => {
    const [isPending, setIsPending] = useState(false);
    const settleSplit = useMutation(
        api.methods.expenses.settleSplit
    ).withOptimisticUpdate((localStore, args) => {
        updateExpenseInStore(localStore, args.expenseId, (exp) => ({
            ...exp,
            _optimisticSettled: args.targetUserId,
        }));
    });

    const mutate = async (
        args: FunctionArgs<typeof api.methods.expenses.settleSplit>
    ) => {
        setIsPending(true);
        try {
            await settleSplit(args);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to settle split"
            );
        } finally {
            setIsPending(false);
        }
    };

    return { mutate, isPending };
};

export const useCreateSettlement = () => {
    const [isPending, setIsPending] = useState(false);
    const createSettlement = useMutation(
        api.methods.expenses.createSettlement
    ).withOptimisticUpdate((localStore, args) => {
        const currentUser = localStore.getQuery(
            api.methods.users.currentUser,
            {}
        );
        if (!currentUser) return;

        let settleAmount = 0;
        const allBalances = localStore.getAllQueries(
            api.methods.expenses.balances
        );
        for (const { args: queryArgs, value } of allBalances) {
            if (!queryArgs || !value || queryArgs.tripId !== args.tripId)
                continue;
            const balances = value as {
                netBalance: Record<string, number>;
                simplified: { from: string; to: string; amount: number }[];
            };
            const debt = balances.simplified.find(
                (s) => s.from === currentUser._id && s.to === args.toUserId
            );
            settleAmount = debt?.amount ?? 0;
            const updated = {
                ...balances,
                simplified: balances.simplified.filter(
                    (s) =>
                        !(s.from === currentUser._id && s.to === args.toUserId)
                ),
            };
            localStore.setQuery(
                api.methods.expenses.balances,
                queryArgs,
                updated as typeof value
            );
            break;
        }

        const allSettlements = localStore.getAllQueries(
            api.methods.expenses.listSettlements
        );
        for (const { args: queryArgs, value } of allSettlements) {
            if (!queryArgs || !value || queryArgs.tripId !== args.tripId)
                continue;

            const optimisticSettlement = {
                _id: nanoid(10) as Id<"settlement">,
                _creationTime: Date.now(),
                tripId: args.tripId,
                fromUserId: currentUser._id,
                toUserId: args.toUserId,
                amount: settleAmount,
                note: args.note,
                _optimistic: true,
            };

            localStore.setQuery(
                api.methods.expenses.listSettlements,
                queryArgs,
                [optimisticSettlement, ...value] as typeof value
            );
            break;
        }
    });

    const mutate = async (
        args: FunctionArgs<typeof api.methods.expenses.createSettlement>
    ) => {
        setIsPending(true);
        try {
            return await createSettlement(args);
        } catch (err) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : "Failed to record settlement"
            );
        } finally {
            setIsPending(false);
        }
    };

    return { mutate, isPending };
};

export function useGlobalExpenseSummary() {
    const data = useQuery(api.methods.expenses.globalSummary, {});

    return {
        summary: data,
        isLoading: data === undefined,
    };
}
