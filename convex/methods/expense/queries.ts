import { v } from "convex/values";
import { query } from "../../_generated/server";
import { requireTripMember, requireUserAccess } from "../../lib/utils";
import { getOrThrow } from "../../lib/helpers";
import { paginationOptsValidator } from "convex/server";
import { components } from "../../_generated/api";
import type { Doc } from "../../betterAuth/_generated/dataModel";

export const list = query({
    args: { tripId: v.id("trip"), paginationOpts: paginationOptsValidator },
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
        const expense = await getOrThrow(ctx, expenseId, "Expense");
        await requireTripMember(ctx, expense.tripId);

        const splits = await ctx.db
            .query("expenseSplit")
            .withIndex("expenseId", (q) => q.eq("expenseId", expenseId))
            .collect();

        const settlements = await ctx.db
            .query("settlement")
            .withIndex("expenseId", (q) => q.eq("expenseId", expenseId))
            .collect();

        return { ...expense, splits, settlements };
    },
});

export const balances = query({
    args: { tripId: v.id("trip") },
    handler: async (ctx, { tripId }) => {
        await requireTripMember(ctx, tripId);

        const cached = await ctx.db
            .query("tripBalance")
            .withIndex("tripId", (q) => q.eq("tripId", tripId))
            .unique();

        if (!cached) {
            return { balances: [], pairwise: [], simplified: [] };
        }

        return {
            balances: cached.balances,
            pairwise: cached.pairwise,
            simplified: cached.simplified,
        };
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
                        .collect()
                )
            )
        ).flat();

        let totalSpent = 0;
        let totalOwed = 0;
        let totalOwing = 0;
        let expenseCount = 0;
        const monthlyMap = new Map<string, number>();
        const perTrip: {
            tripId: string;
            tripTitle: string;
            totalExpenses: number;
            userBalance: number;
            expenseCount: number;
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
            expenseCount += expenses.length;

            for (const expense of expenses) {
                if (expense.paidBy !== user._id) continue;
                const d = new Date(expense.date);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                monthlyMap.set(
                    key,
                    (monthlyMap.get(key) ?? 0) + expense.amount
                );
            }

            const cached = await ctx.db
                .query("tripBalance")
                .withIndex("tripId", (q) => q.eq("tripId", trip._id))
                .unique();

            let tripOwed = 0;
            let tripOwing = 0;

            if (cached) {
                const entry = cached.balances.find(
                    (b) => b.userId === user._id
                );
                if (entry) {
                    if (entry.amount > 0) {
                        tripOwed = entry.amount;
                    } else if (entry.amount < 0) {
                        tripOwing = -entry.amount;
                    }
                }
            }

            totalOwed += tripOwed;
            totalOwing += tripOwing;

            perTrip.push({
                tripId: trip._id,
                tripTitle: trip.title,
                totalExpenses: tripTotal,
                userBalance: tripOwed - tripOwing,
                expenseCount: expenses.length,
            });
        }

        const now = new Date();
        const monthlySpending: { month: string; amount: number }[] = [];
        for (let i = 11; i >= 0; i--) {
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

        const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const prevD = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevKey = `${prevD.getFullYear()}-${String(prevD.getMonth() + 1).padStart(2, "0")}`;
        const thisMonthSpent = monthlyMap.get(currentKey) ?? 0;
        const lastMonthSpent = monthlyMap.get(prevKey) ?? 0;

        perTrip.sort((a, b) => b.totalExpenses - a.totalExpenses);

        return {
            totalSpent,
            totalOwed,
            totalOwing,
            expenseCount,
            tripCount: trips.length,
            thisMonthSpent,
            lastMonthSpent,
            monthlySpending,
            perTrip,
        };
    },
});
