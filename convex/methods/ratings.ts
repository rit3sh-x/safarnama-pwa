import { ConvexError, v } from "convex/values"
import { mutation, query } from "../_generated/server"
import { requireUserAccess } from "../lib/utils"
import type { RatingValue } from "@backend/types"

export const rate = mutation({
  args: {
    blogId: v.id("blog"),
    rating: v.number(),
  },
  handler: async (ctx, { blogId, rating }) => {
    const user = await requireUserAccess(ctx)

    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      throw new ConvexError("Rating must be an integer between 1 and 5")
    }

    const ratingValue = rating as RatingValue

    const blog = await ctx.db.get(blogId)
    if (!blog) throw new ConvexError("Blog not found")

    const existing = await ctx.db
      .query("blogRating")
      .withIndex("blogId_userId", (q) =>
        q.eq("blogId", blogId).eq("userId", user._id)
      )
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, { rating: ratingValue })
    } else {
      await ctx.db.insert("blogRating", {
        blogId,
        userId: user._id,
        rating: ratingValue,
      })
    }
  },
})

export const getForBlog = query({
  args: { blogId: v.id("blog") },
  handler: async (ctx, { blogId }) => {
    const user = await requireUserAccess(ctx)

    const ratings = await ctx.db
      .query("blogRating")
      .withIndex("blogId", (q) => q.eq("blogId", blogId))
      .collect()

    const totalRatings = ratings.length

    const avgRating =
      totalRatings > 0
        ? Math.round(
          (ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings) * 10
        ) / 10
        : 0

    const distribution: Record<RatingValue, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    }

    for (const r of ratings) {
      distribution[r.rating as RatingValue]++
    }

    const mine = ratings.find((r) => r.userId === user._id)

    return {
      avgRating,
      totalRatings,
      distribution,
      userRating: mine?.rating ?? null,
    }
  },
})
