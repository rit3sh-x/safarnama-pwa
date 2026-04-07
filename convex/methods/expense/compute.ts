import { v } from "convex/values";
import { internalMutation } from "../../_generated/server";
import {
    computeNetBalances,
    computePairwiseDebts,
    simplifyDebts,
} from "../../lib/debtSimplification";

export const recomputeBalances = internalMutation({
    args: { tripId: v.id("trip") },
    handler: async (ctx, { tripId }) => {
        const splits = await ctx.db
            .query("expenseSplit")
            .withIndex("tripId", (q) => q.eq("tripId", tripId))
            .collect();

        const settlements = await ctx.db
            .query("settlement")
            .withIndex("tripId", (q) => q.eq("tripId", tripId))
            .collect();

        const rawDebts: { from: string; to: string; amount: number }[] = [];

        for (const split of splits) {
            if (split.userId !== split.paidBy) {
                rawDebts.push({
                    from: split.userId,
                    to: split.paidBy,
                    amount: split.owedAmount,
                });
            }
        }

        for (const settlement of settlements) {
            rawDebts.push({
                from: settlement.toUserId,
                to: settlement.fromUserId,
                amount: settlement.amount,
            });
        }

        const balanceEntries = computeNetBalances(rawDebts);
        const pairwise = computePairwiseDebts(rawDebts);
        const simplified = simplifyDebts(rawDebts);

        const existing = await ctx.db
            .query("tripBalance")
            .withIndex("tripId", (q) => q.eq("tripId", tripId))
            .unique();

        const data = {
            tripId,
            balances: balanceEntries.map((b) => ({
                userId: b.id,
                amount: b.net,
            })),
            pairwise,
            simplified,
            computedAt: Date.now(),
        };

        if (existing) {
            await ctx.db.patch(existing._id, data);
        } else {
            await ctx.db.insert("tripBalance", data);
        }
    },
});
