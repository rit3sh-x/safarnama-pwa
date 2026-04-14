import { ConvexError, v } from "convex/values";
import { mutation } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { requireTripMember } from "../../lib/utils";
import { getOrThrow, requireOwnerOrAdmin } from "../../lib/helpers";
import { notifyTrip, notifyUser } from "../../lib/notify";
import { rateLimit } from "../../lib/rateLimit";

export const create = mutation({
    args: {
        tripId: v.id("trip"),
        title: v.string(),
        amount: v.number(),
        paidBy: v.string(),
        date: v.number(),
        notes: v.optional(v.string()),
        receiptUrl: v.optional(v.string()),
        splitType: v.union(
            v.literal("equal"),
            v.literal("exact"),
            v.literal("percentage"),
            v.literal("payer_only")
        ),
        splits: v.array(
            v.object({
                userId: v.string(),
                owedAmount: v.number(),
                percentage: v.optional(v.number()),
            })
        ),
    },
    handler: async (ctx, { tripId, ...fields }) => {
        const { user } = await requireTripMember(ctx, tripId);
        await rateLimit(ctx, "createExpense", user._id);

        const expenseId = await ctx.db.insert("expense", {
            tripId,
            amount: fields.amount,
            date: fields.date,
            notes: fields.notes,
            paidBy: fields.paidBy,
            receiptUrl: fields.receiptUrl,
            splitType: fields.splitType,
            title: fields.title,
            updatedAt: Date.now(),
        });

        for (const split of fields.splits) {
            await ctx.db.insert("expenseSplit", {
                expenseId,
                tripId,
                userId: split.userId,
                owedAmount: split.owedAmount,
                percentage: split.percentage,
                paidBy: fields.paidBy,
            });
        }

        await ctx.db.insert("message", {
            tripId,
            senderId: user._id,
            type: "expense_event",
            expenseId,
            content: `added expense: ${fields.title} — ₹${fields.amount.toFixed(2)}`,
        });

        await notifyTrip(ctx, {
            tripId,
            excludeUserId: user._id,
            type: "expense",
            referenceId: expenseId,
            title: "New Expense",
            body: `${fields.title} — ₹${fields.amount.toFixed(2)}`,
            url: `/trip/${tripId}/expenses`,
        });

        await ctx.scheduler.runAfter(
            0,
            internal.methods.expense.compute.recomputeBalances,
            { tripId }
        );

        return expenseId;
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
        const expense = await getOrThrow(ctx, expenseId, "Expense");
        const { user, member } = await requireTripMember(ctx, expense.tripId);
        requireOwnerOrAdmin(expense.paidBy, user._id, member.role, "expense");
        await rateLimit(ctx, "updateExpense", user._id);

        await ctx.db.patch(expenseId, { ...fields, updatedAt: Date.now() });

        await ctx.scheduler.runAfter(
            0,
            internal.methods.expense.compute.recomputeBalances,
            { tripId: expense.tripId }
        );
    },
});

export const remove = mutation({
    args: {
        expenseId: v.id("expense"),
    },
    handler: async (ctx, { expenseId }) => {
        const expense = await getOrThrow(ctx, expenseId, "Expense");
        const { user, member } = await requireTripMember(ctx, expense.tripId);
        requireOwnerOrAdmin(expense.paidBy, user._id, member.role, "expense");
        await rateLimit(ctx, "deleteExpense", user._id);

        const splits = await ctx.db
            .query("expenseSplit")
            .withIndex("expenseId", (q) => q.eq("expenseId", expenseId))
            .collect();

        for (const split of splits) {
            await ctx.db.delete(split._id);
        }

        await ctx.db.delete(expenseId);

        await ctx.scheduler.runAfter(
            0,
            internal.methods.expense.compute.recomputeBalances,
            { tripId: expense.tripId }
        );
    },
});

export const createSettlement = mutation({
    args: {
        tripId: v.id("trip"),
        toUserId: v.string(),
        amount: v.number(),
        note: v.optional(v.string()),
        expenseId: v.optional(v.id("expense")),
    },
    handler: async (ctx, { tripId, toUserId, amount, note, expenseId }) => {
        const { user } = await requireTripMember(ctx, tripId);
        await rateLimit(ctx, "createSettlement", user._id);

        if (amount <= 0) {
            throw new ConvexError({
                code: "BAD_REQUEST",
                message: "Amount must be greater than 0",
            });
        }

        if (user._id === toUserId) {
            throw new ConvexError({
                code: "BAD_REQUEST",
                message: "Cannot settle with yourself",
            });
        }

        if (expenseId) {
            const existing = await ctx.db
                .query("settlement")
                .withIndex("expenseId_fromUserId", (q) =>
                    q.eq("expenseId", expenseId).eq("fromUserId", user._id)
                )
                .first();

            if (existing) {
                throw new ConvexError({
                    code: "ALREADY_SETTLED",
                    message: "You've already settled this expense.",
                });
            }
        }

        const settlementId = await ctx.db.insert("settlement", {
            tripId,
            fromUserId: user._id,
            toUserId,
            amount,
            note,
            expenseId,
            createdAt: Date.now(),
        });

        await notifyUser(ctx, {
            userId: toUserId,
            type: "settlement",
            tripId,
            referenceId: settlementId,
            title: "Payment Received",
            body: `You received a settlement of ₹${amount.toFixed(2)}`,
            url: `/trip/${tripId}/expenses`,
        });

        await ctx.scheduler.runAfter(
            0,
            internal.methods.expense.compute.recomputeBalances,
            { tripId }
        );

        return settlementId;
    },
});
