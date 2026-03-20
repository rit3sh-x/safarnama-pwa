import { v } from "convex/values"
import { mutation, query } from "../_generated/server"
import {
  requireTripAdmin,
  requireTripMember,
  getTripFromTripId,
} from "../lib/utils"
import { paginationOptsValidator } from "convex/server"

export const browse = query({
  args: {
    search: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { search, paginationOpts }) => {
    const searchTerm = search?.trim()

    if (searchTerm) {
      const results = await ctx.db
        .query("blog")
        .withSearchIndex("search", (qb) =>
          qb
            .search("title", searchTerm)
            .eq("published", true)
            .eq("isPublic", true)
        )
        .take(paginationOpts.numItems)

      return { page: results, isDone: true, continueCursor: "" }
    }

    const results = await ctx.db
      .query("blog")
      .filter((q) =>
        q.and(q.eq(q.field("published"), true), q.eq(q.field("isPublic"), true))
      )
      .order("desc")
      .paginate(paginationOpts)

    return results
  },
})

export const get = query({
  args: { tripId: v.id("trip") },
  handler: async (ctx, { tripId }) => {
    const trip = await getTripFromTripId(ctx, tripId)
    const blog = await ctx.db
      .query("blog")
      .withIndex("tripId", (q) => q.eq("tripId", tripId))
      .unique()

    if (trip.isPublic && blog?.published) return blog

    await requireTripMember(ctx, tripId)
    return blog ?? null
  },
})

export const upsert = mutation({
  args: {
    tripId: v.id("trip"),
    title: v.string(),
    content: v.string(),
    coverImage: v.optional(v.string()),
    published: v.boolean(),
  },
  handler: async (ctx, { tripId, ...fields }) => {
    await requireTripAdmin(ctx, tripId)
    const now = Date.now()
    const trip = await getTripFromTripId(ctx, tripId)

    const existing = await ctx.db
      .query("blog")
      .withIndex("tripId", (q) => q.eq("tripId", tripId))
      .unique()

    const denormalized = {
      tripTitle: trip.title,
      tripDestination: trip.destination,
      isPublic: trip.isPublic,
    }

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...fields,
        ...denormalized,
        publishedAt:
          fields.published && !existing.published ? now : existing.publishedAt,
        updatedAt: now,
      })
    } else {
      await ctx.db.insert("blog", {
        tripId,
        ...fields,
        ...denormalized,
        publishedAt: fields.published ? now : undefined,
        updatedAt: now,
      })
    }

    await ctx.db.patch(tripId, { updatedAt: now })
  },
})

export const remove = mutation({
  args: { tripId: v.id("trip") },
  handler: async (ctx, { tripId }) => {
    await requireTripAdmin(ctx, tripId)

    const blog = await ctx.db
      .query("blog")
      .withIndex("tripId", (q) => q.eq("tripId", tripId))
      .unique()

    if (blog) {
      const comments = await ctx.db
        .query("blogComment")
        .withIndex("tripId", (q) => q.eq("tripId", tripId))
        .collect()
      await Promise.all(comments.map((c) => ctx.db.delete(c._id)))

      await ctx.db.delete(blog._id)
    }

    await ctx.db.patch(tripId, { updatedAt: Date.now() })
  },
})
