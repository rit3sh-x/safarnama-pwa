import { internalMutation } from "../../_generated/server";
import { internal } from "../../_generated/api";

export const migrateExpenseSplits = internalMutation({
    args: {},
    handler: async (ctx) => {
        let splitsProcessed = 0;
        let settlementsCreated = 0;
        const affectedTripIds = new Set<string>();

        const allSplits = await ctx.db.query("expenseSplit").collect();

        for (const split of allSplits) {
            const expense = await ctx.db.get(split.expenseId);
            if (!expense) continue;

            splitsProcessed++;
            affectedTripIds.add(split.tripId);

            if (!split.paidBy) {
                await ctx.db.patch(split._id, { paidBy: expense.paidBy });
            }

            const raw = split as Record<string, unknown>;
            const isSettled = raw.settled === true;

            if (isSettled && split.userId !== expense.paidBy) {
                const settledAt =
                    typeof raw.settledAt === "number"
                        ? raw.settledAt
                        : undefined;

                const existingSettlements = await ctx.db
                    .query("settlement")
                    .withIndex("tripId", (q) => q.eq("tripId", split.tripId))
                    .collect();

                const alreadyCovered = existingSettlements.some(
                    (s) =>
                        s.fromUserId === split.userId &&
                        s.toUserId === expense.paidBy &&
                        Math.abs(s.amount - split.owedAmount) < 0.01
                );

                if (!alreadyCovered) {
                    await ctx.db.insert("settlement", {
                        tripId: split.tripId,
                        fromUserId: split.userId,
                        toUserId: expense.paidBy,
                        amount: split.owedAmount,
                        expenseId: split.expenseId,
                        createdAt: settledAt ?? Date.now(),
                    });
                    settlementsCreated++;
                }
            }
        }

        const scheduledTrips = new Set<string>();
        for (const split of allSplits) {
            if (!scheduledTrips.has(split.tripId)) {
                scheduledTrips.add(split.tripId);
                await ctx.scheduler.runAfter(
                    0,
                    internal.methods.expense.compute.recomputeBalances,
                    { tripId: split.tripId }
                );
            }
        }

        return {
            splitsProcessed,
            settlementsCreated,
            tripsRecomputed: scheduledTrips.size,
        };
    },
});
