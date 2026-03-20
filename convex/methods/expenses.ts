import { ConvexError, v } from "convex/values"
import { mutation, query } from "../_generated/server"
import { requireTripMember } from "../lib/utils"
import { paginationOptsValidator } from "convex/server"
import { simplifyDebts } from "../lib/debtSimplification"

const splitTypeValidator = v.union(
  v.literal("equal"),
  v.literal("exact"),
  v.literal("percentage"),
  v.literal("payer_only")
)

const splitInputValidator = v.array(
  v.object({
    userId: v.string(),
    owedAmount: v.number(),
    percentage: v.optional(v.number()),
  })
)

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
    const { user } = await requireTripMember(ctx, tripId)

    const now = Date.now()
    const expenseId = await ctx.db.insert("expense", {
      tripId,
      ...fields,
      updatedAt: now,
    })

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
    )

    await ctx.db.insert("message", {
      tripId,
      senderId: user._id,
      type: "expense_event",
      expenseId,
      content: `added expense: ${fields.title} — ₹${fields.amount.toFixed(2)}`,
    })

    return expenseId
  },
})

export const list = query({
  args: {
    tripId: v.id("trip"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { tripId, paginationOpts }) => {
    await requireTripMember(ctx, tripId)
    return ctx.db
      .query("expense")
      .withIndex("tripId_date", (q) => q.eq("tripId", tripId))
      .order("desc")
      .paginate(paginationOpts)
  },
})

export const get = query({
  args: { expenseId: v.id("expense") },
  handler: async (ctx, { expenseId }) => {
    const expense = await ctx.db.get(expenseId)
    if (!expense)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Expense not found",
      })
    await requireTripMember(ctx, expense.tripId)
    const splits = await ctx.db
      .query("expenseSplit")
      .withIndex("expenseId", (q) => q.eq("expenseId", expenseId))
      .collect()
    return { ...expense, splits }
  },
})

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
    const expense = await ctx.db.get(expenseId)
    if (!expense)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Expense not found",
      })
    const { user, member } = await requireTripMember(ctx, expense.tripId)
    if (expense.paidBy !== user._id && member.role !== "owner")
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Unauthorized",
      })
    await ctx.db.patch(expenseId, { ...fields, updatedAt: Date.now() })
  },
})

export const remove = mutation({
  args: { expenseId: v.id("expense") },
  handler: async (ctx, { expenseId }) => {
    const expense = await ctx.db.get(expenseId)
    if (!expense)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Expense not found",
      })
    const { user, member } = await requireTripMember(ctx, expense.tripId)
    if (expense.paidBy !== user._id && member.role !== "owner")
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Unauthorized",
      })

    const splits = await ctx.db
      .query("expenseSplit")
      .withIndex("expenseId", (q) => q.eq("expenseId", expenseId))
      .collect()
    await Promise.all(splits.map((s) => ctx.db.delete(s._id)))
    await ctx.db.delete(expenseId)
  },
})

export const settleSplit = mutation({
  args: {
    expenseId: v.id("expense"),
    targetUserId: v.string(),
  },
  handler: async (ctx, { expenseId, targetUserId }) => {
    const expense = await ctx.db.get(expenseId)
    if (!expense)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Expense not found",
      })
    const { user, member } = await requireTripMember(ctx, expense.tripId)
    if (expense.paidBy !== user._id && member.role !== "owner")
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Unauthorized",
      })

    const split = await ctx.db
      .query("expenseSplit")
      .withIndex("expenseId", (q) => q.eq("expenseId", expenseId))
      .filter((q) => q.eq(q.field("userId"), targetUserId))
      .unique()
    if (!split)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Split not found",
      })
    await ctx.db.patch(split._id, { settled: true, settledAt: Date.now() })
  },
})

export const balances = query({
  args: { tripId: v.id("trip") },
  handler: async (ctx, { tripId }) => {
    await requireTripMember(ctx, tripId)

    const splits = await ctx.db
      .query("expenseSplit")
      .withIndex("tripId_userId", (q) => q.eq("tripId", tripId))
      .collect()

    const rawDebts: { paidBy: string; owedBy: string; amount: number }[] = []

    for (const split of splits) {
      if (split.settled) continue
      const expense = await ctx.db.get(split.expenseId)
      if (!expense || split.userId === expense.paidBy) continue
      rawDebts.push({
        paidBy: expense.paidBy,
        owedBy: split.userId,
        amount: split.owedAmount,
      })
    }

    const simplified = simplifyDebts(rawDebts)

    const netBalance: Record<string, number> = {}
    for (const { paidBy, owedBy, amount } of rawDebts) {
      netBalance[paidBy] = (netBalance[paidBy] ?? 0) + amount
      netBalance[owedBy] = (netBalance[owedBy] ?? 0) - amount
    }

    return { netBalance, simplified }
  },
})

export const createSettlement = mutation({
  args: {
    tripId: v.id("trip"),
    toUserId: v.string(),
    amount: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { tripId, toUserId, amount, note }) => {
    const { user } = await requireTripMember(ctx, tripId)
    return ctx.db.insert("settlement", {
      tripId,
      fromUserId: user._id,
      toUserId,
      amount,
      note,
    })
  },
})

export const listSettlements = query({
  args: { tripId: v.id("trip") },
  handler: async (ctx, { tripId }) => {
    await requireTripMember(ctx, tripId)
    return ctx.db
      .query("settlement")
      .withIndex("tripId", (q) => q.eq("tripId", tripId))
      .order("desc")
      .collect()
  },
})
