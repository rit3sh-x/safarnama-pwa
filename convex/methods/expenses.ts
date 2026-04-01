import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { internal } from "../_generated/api";
import { requireTripMember, requireUserAccess } from "../lib/utils";
import { components } from "../_generated/api";
import { paginationOptsValidator } from "convex/server";
import { simplifyDebts } from "../lib/debtSimplification";
import type { Doc } from "../betterAuth/_generated/dataModel";

const splitTypeValidator = v.union(
    v.literal("equal"),
    v.literal("exact"),
    v.literal("percentage"),
    v.literal("payer_only")
);

const splitInputValidator = v.array(
    v.object({
        userId: v.string(),
        owedAmount: v.number(),
        percentage: v.optional(v.number()),
    })
);

export const create = mutation({
    args: {
        tripId: v.id("trip"),
        title: v.string(),
        amount: v.number(),
        paidBy: v.string(),
        date: v.number(),
        notes: v.optional(v.string()),
        receiptUrl: v.optional(v.string()),
        splitType: splitTypeValidator,
        splits: splitInputValidator,
    },
    handler: async (ctx, { tripId, splits, ...fields }) => {
        const { user } = await requireTripMember(ctx, tripId);

        const now = Date.now();
        const expenseId = await ctx.db.insert("expense", {
            tripId,
            ...fields,
            updatedAt: now,
        });

        await Promise.all(
            splits.map((s) =>
                ctx.db.insert("expenseSplit", {
                    expenseId,
                    tripId,
                    userId: s.userId,
                    owedAmount: s.owedAmount,
                    percentage: s.percentage,
                    settled: s.userId === fields.paidBy,
                })
            )
        );

        await ctx.db.insert("message", {
            tripId,
            senderId: user._id,
            type: "expense_event",
            expenseId,
            content: `added expense: ${fields.title} — ₹${fields.amount.toFixed(2)}`,
        });

        const trip = await ctx.db.get(tripId);
        await ctx.scheduler.runAfter(
            0,
            internal.methods.notifications.notifyTripMembers,
            {
                tripId,
                excludeUserId: user._id,
                type: "expense",
                referenceId: expenseId,
                title: trip?.title ?? "Trip",
                body: `${user.name ?? "Someone"} added ₹${fields.amount.toFixed(0)} for ${fields.title}`,
                url: `/trips/${tripId}/expenses`,
            }
        );

        return expenseId;
    },
});

export const list = query({
    args: {
        tripId: v.id("trip"),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, { tripId, paginationOpts }) => {
        await requireTripMember(ctx, tripId);
        return ctx.db
            .query("expense")
            .withIndex("tripId_date", (q) => q.eq("tripId", tripId))
            .order("desc")
            .paginate(paginationOpts);
    },
});

export const get = query({
    args: { expenseId: v.id("expense") },
    handler: async (ctx, { expenseId }) => {
        const expense = await ctx.db.get(expenseId);
        if (!expense)
            throw new ConvexError({
                code: "NOT_FOUND",
                message: "Expense not found",
            });
        await requireTripMember(ctx, expense.tripId);
        const splits = await ctx.db
            .query("expenseSplit")
            .withIndex("expenseId", (q) => q.eq("expenseId", expenseId))
            .collect();
        return { ...expense, splits };
    },
});

export const update = mutation({
    args: {
        expenseId: v.id("expense"),
        title: v.optional(v.string()),
        amount: v.optional(v.number()),
        date: v.optional(v.number()),
        notes: v.optional(v.string()),
        receiptUrl: v.optional(v.string()),
    },
    handler: async (ctx, { expenseId, ...fields }) => {
        const expense = await ctx.db.get(expenseId);
        if (!expense)
            throw new ConvexError({
                code: "NOT_FOUND",
                message: "Expense not found",
            });
        const { user, member } = await requireTripMember(ctx, expense.tripId);
        if (expense.paidBy !== user._id && member.role !== "owner")
            throw new ConvexError({
                code: "FORBIDDEN",
                message: "Unauthorized",
            });
        await ctx.db.patch(expenseId, { ...fields, updatedAt: Date.now() });
    },
});

export const remove = mutation({
    args: { expenseId: v.id("expense") },
    handler: async (ctx, { expenseId }) => {
        const expense = await ctx.db.get(expenseId);
        if (!expense)
            throw new ConvexError({
                code: "NOT_FOUND",
                message: "Expense not found",
            });
        const { user, member } = await requireTripMember(ctx, expense.tripId);
        if (expense.paidBy !== user._id && member.role !== "owner")
            throw new ConvexError({
                code: "FORBIDDEN",
                message: "Unauthorized",
            });

        const splits = await ctx.db
            .query("expenseSplit")
            .withIndex("expenseId", (q) => q.eq("expenseId", expenseId))
            .collect();
        await Promise.all(splits.map((s) => ctx.db.delete(s._id)));
        await ctx.db.delete(expenseId);
    },
});

export const settleSplit = mutation({
    args: {
        expenseId: v.id("expense"),
        targetUserId: v.string(),
    },
    handler: async (ctx, { expenseId, targetUserId }) => {
        const expense = await ctx.db.get(expenseId);
        if (!expense)
            throw new ConvexError({
                code: "NOT_FOUND",
                message: "Expense not found",
            });
        const { user, member } = await requireTripMember(ctx, expense.tripId);
        if (expense.paidBy !== user._id && member.role !== "owner")
            throw new ConvexError({
                code: "FORBIDDEN",
                message: "Unauthorized",
            });

        const split = await ctx.db
            .query("expenseSplit")
            .withIndex("expenseId", (q) => q.eq("expenseId", expenseId))
            .filter((q) => q.eq(q.field("userId"), targetUserId))
            .unique();
        if (!split)
            throw new ConvexError({
                code: "NOT_FOUND",
                message: "Split not found",
            });
        await ctx.db.patch(split._id, { settled: true, settledAt: Date.now() });
    },
});

export const balances = query({
    args: { tripId: v.id("trip") },
    handler: async (ctx, { tripId }) => {
        await requireTripMember(ctx, tripId);

        const splits = await ctx.db
            .query("expenseSplit")
            .withIndex("tripId_userId", (q) => q.eq("tripId", tripId))
            .collect();

        const rawDebts: { paidBy: string; owedBy: string; amount: number }[] =
            [];

        for (const split of splits) {
            if (split.settled) continue;
            const expense = await ctx.db.get(split.expenseId);
            if (!expense || split.userId === expense.paidBy) continue;
            rawDebts.push({
                paidBy: expense.paidBy,
                owedBy: split.userId,
                amount: split.owedAmount,
            });
        }

        const simplified = simplifyDebts(rawDebts);

        const netBalance: Record<string, number> = {};
        for (const { paidBy, owedBy, amount } of rawDebts) {
            netBalance[paidBy] = (netBalance[paidBy] ?? 0) + amount;
            netBalance[owedBy] = (netBalance[owedBy] ?? 0) - amount;
        }

        return { netBalance, simplified };
    },
});

export const createSettlement = mutation({
    args: {
        tripId: v.id("trip"),
        toUserId: v.string(),
        note: v.optional(v.string()),
    },
    handler: async (ctx, { tripId, toUserId, note }) => {
        const { user } = await requireTripMember(ctx, tripId);

        const splits = await ctx.db
            .query("expenseSplit")
            .withIndex("tripId_userId", (q) => q.eq("tripId", tripId))
            .collect();

        let owedAmount = 0;
        for (const split of splits) {
            if (split.settled || split.userId !== user._id) continue;
            const expense = await ctx.db.get(split.expenseId);
            if (!expense || expense.paidBy !== toUserId) continue;
            owedAmount += split.owedAmount;
        }

        if (owedAmount <= 0)
            throw new ConvexError({
                code: "BAD_REQUEST",
                message: "Nothing owed to this user",
            });

        const unsettledSplits = await ctx.db
            .query("expenseSplit")
            .withIndex("tripId_userId", (q) => q.eq("tripId", tripId))
            .collect();

        await Promise.all(
            unsettledSplits
                .filter((s) => {
                    if (s.settled || s.userId !== user._id) return false;
                    return true;
                })
                .map(async (s) => {
                    const expense = await ctx.db.get(s.expenseId);
                    if (expense?.paidBy === toUserId) {
                        await ctx.db.patch(s._id, {
                            settled: true,
                            settledAt: Date.now(),
                        });
                    }
                })
        );

        const settlementId = await ctx.db.insert("settlement", {
            tripId,
            fromUserId: user._id,
            toUserId,
            amount: owedAmount,
            note,
        });

        const trip = await ctx.db.get(tripId);
        await ctx.scheduler.runAfter(
            0,
            internal.methods.notifications.createNotification,
            {
                userId: toUserId,
                type: "settlement",
                tripId,
                referenceId: settlementId,
                title: trip?.title ?? "Trip",
                body: `${user.name ?? "Someone"} settled ₹${owedAmount.toFixed(0)} with you`,
                url: `/trips/${tripId}/expenses`,
            }
        );

        return settlementId;
    },
});

export const listSettlements = query({
    args: { tripId: v.id("trip") },
    handler: async (ctx, { tripId }) => {
        await requireTripMember(ctx, tripId);
        return ctx.db
            .query("settlement")
            .withIndex("tripId", (q) => q.eq("tripId", tripId))
            .order("desc")
            .collect();
    },
});

export const globalSummary = query({
    args: {},
    handler: async (ctx) => {
        const user = await requireUserAccess(ctx);

        const memberships: Doc<"member">[] = await ctx.runQuery(
            components.betterAuth.methods.orgs.listUserMemberships,
            { userId: user._id }
        );

        const orgIds = memberships.map((m) => m.organizationId);
        const trips = (
            await Promise.all(
                orgIds.map((orgId) =>
                    ctx.db
                        .query("trip")
                        .withIndex("orgId", (q) => q.eq("orgId", orgId))
                        .unique()
                )
            )
        ).filter((t): t is NonNullable<typeof t> => t !== null);

        let totalSpent = 0;
        let totalOwed = 0;
        let totalOwing = 0;
        const monthlyMap = new Map<string, number>();
        const perTrip: {
            tripId: string;
            tripTitle: string;
            totalExpenses: number;
            userBalance: number;
        }[] = [];

        for (const trip of trips) {
            const expenses = await ctx.db
                .query("expense")
                .withIndex("tripId", (q) => q.eq("tripId", trip._id))
                .collect();

            const tripTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
            const userPaid = expenses
                .filter((e) => e.paidBy === user._id)
                .reduce((sum, e) => sum + e.amount, 0);

            totalSpent += userPaid;

            for (const expense of expenses) {
                if (expense.paidBy !== user._id) continue;
                const d = new Date(expense.date);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                monthlyMap.set(
                    key,
                    (monthlyMap.get(key) ?? 0) + expense.amount
                );
            }

            const splits = await ctx.db
                .query("expenseSplit")
                .withIndex("tripId_userId", (q) => q.eq("tripId", trip._id))
                .collect();

            let tripOwed = 0;
            let tripOwing = 0;
            for (const split of splits) {
                if (split.settled) continue;
                const expense = await ctx.db.get(split.expenseId);
                if (!expense || split.userId === expense.paidBy) continue;
                if (expense.paidBy === user._id) {
                    tripOwed += split.owedAmount;
                }
                if (split.userId === user._id) {
                    tripOwing += split.owedAmount;
                }
            }

            totalOwed += tripOwed;
            totalOwing += tripOwing;

            perTrip.push({
                tripId: trip._id,
                tripTitle: trip.title,
                totalExpenses: tripTotal,
                userBalance: tripOwed - tripOwing,
            });
        }

        const now = new Date();
        const monthlySpending: { month: string; amount: number }[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            const label = d.toLocaleDateString("en-US", {
                month: "short",
                year: "2-digit",
            });
            monthlySpending.push({
                month: label,
                amount: monthlyMap.get(key) ?? 0,
            });
        }

        perTrip.sort((a, b) => b.totalExpenses - a.totalExpenses);

        return {
            totalSpent,
            totalOwed,
            totalOwing,
            monthlySpending,
            perTrip,
        };
    },
});
