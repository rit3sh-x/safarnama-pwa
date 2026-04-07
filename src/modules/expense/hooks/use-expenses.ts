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
    const allPages = localStore.getAllQueries(api.methods.expense.queries.list);
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
        localStore.setQuery(api.methods.expense.queries.list, queryArgs, {
            ...value,
            page: updated,
        } as typeof value);
        break;
    }
}

export function useExpenses(tripId: Id<"trip"> | undefined) {
    const listQuery = api.methods.expense.queries.list as unknown as Parameters<
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
        api.methods.expense.queries.balances,
        tripId ? { tripId } : "skip"
    );

    return {
        balances: data,
        isLoading: data === undefined,
    };
}

export function useSettlements(tripId: Id<"trip"> | undefined) {
    const data = useQuery(
        api.methods.expense.queries.listSettlements,
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
        api.methods.expense.mutations.create
    ).withOptimisticUpdate((localStore, args) => {
        const allPages = localStore.getAllQueries(
            api.methods.expense.queries.list
        );
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

            localStore.setQuery(api.methods.expense.queries.list, queryArgs, {
                ...value,
                page: [optimisticExpense, ...value.page],
            });
            break;
        }
    });

    const mutate = async (
        args: FunctionArgs<typeof api.methods.expense.mutations.create>
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
        api.methods.expense.mutations.update
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
        args: FunctionArgs<typeof api.methods.expense.mutations.update>
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
        api.methods.expense.mutations.remove
    ).withOptimisticUpdate((localStore, args) => {
        updateExpenseInStore(localStore, args.expenseId, () => null);
    });

    const mutate = async (
        args: FunctionArgs<typeof api.methods.expense.mutations.remove>
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

export const useCreateSettlement = () => {
    const [isPending, setIsPending] = useState(false);
    const createSettlement = useMutation(
        api.methods.expense.mutations.createSettlement
    ).withOptimisticUpdate((localStore, args) => {
        const currentUser = localStore.getQuery(
            api.methods.users.currentUser,
            {}
        );
        if (!currentUser) return;

        const currentUserId = currentUser._id;
        const allBalances = localStore.getAllQueries(
            api.methods.expense.queries.balances
        );
        for (const { args: queryArgs, value } of allBalances) {
            if (!queryArgs || !value || queryArgs.tripId !== args.tripId)
                continue;
            const balances = value as {
                balances: unknown[];
                pairwise: unknown[];
                simplified: { from: string; to: string; amount: number }[];
            };
            const updatedSimplified = balances.simplified
                .map((s) => {
                    if (s.from === currentUserId && s.to === args.toUserId) {
                        return { ...s, amount: s.amount - args.amount };
                    }
                    return s;
                })
                .filter(
                    (s) =>
                        !(
                            s.from === currentUserId &&
                            s.to === args.toUserId &&
                            s.amount <= 0.01
                        )
                );
            const updated = {
                ...balances,
                simplified: updatedSimplified,
            };
            localStore.setQuery(
                api.methods.expense.queries.balances,
                queryArgs,
                updated as typeof value
            );
            break;
        }

        const allSettlements = localStore.getAllQueries(
            api.methods.expense.queries.listSettlements
        );
        for (const { args: queryArgs, value } of allSettlements) {
            if (!queryArgs || !value || queryArgs.tripId !== args.tripId)
                continue;

            const optimisticSettlement = {
                _id: nanoid(10) as Id<"settlement">,
                _creationTime: Date.now(),
                tripId: args.tripId,
                fromUserId: currentUserId,
                toUserId: args.toUserId,
                amount: args.amount,
                note: args.note,
                expenseId: args.expenseId,
                createdAt: Date.now(),
                _optimistic: true,
            };

            localStore.setQuery(
                api.methods.expense.queries.listSettlements,
                queryArgs,
                [optimisticSettlement, ...value] as typeof value
            );
            break;
        }
    });

    const mutate = async (
        args: FunctionArgs<
            typeof api.methods.expense.mutations.createSettlement
        >
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
    const data = useQuery(api.methods.expense.queries.globalSummary, {});

    return {
        summary: data,
        isLoading: data === undefined,
    };
}
