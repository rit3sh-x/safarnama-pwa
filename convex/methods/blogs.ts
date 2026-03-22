import { v } from "convex/values"
import { mutation, query } from "../_generated/server"
import {
  requireTripAdmin,
  requireUserAccess,
  getTripFromTripId,
} from "../lib/utils"
import { components } from "../_generated/api"
import { paginationOptsValidator } from "convex/server"
import type { Doc } from "../betterAuth/_generated/dataModel"

export const browse = query({
  args: {
    search: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { search, paginationOpts }) => {
    await requireUserAccess(ctx)
    const searchTerm = search?.trim()

    if (searchTerm) {
      const results = await ctx.db
        .query("blog")
        .withSearchIndex("search", (qb) =>
          qb
            .search("title", searchTerm)
            .eq("status", "published")
        )
        .take(paginationOpts.numItems)

      return { page: results, isDone: true, continueCursor: "" }
    }

    const results = await ctx.db
      .query("blog")
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "published"),
        )
      )
      .order("desc")
      .paginate(paginationOpts)

    return results
  },
})

export const get = query({
  args: { tripId: v.id("trip") },
  handler: async (ctx, { tripId }) => {
    await requireUserAccess(ctx)
    const blog = await ctx.db
      .query("blog")
      .withIndex("tripId", (q) => q.eq("tripId", tripId))
      .unique()

    if (blog?.status === "published") return blog
    return null
  },
})

export const getById = query({
  args: { blogId: v.id("blog") },
  handler: async (ctx, { blogId }) => {
    const user = await requireUserAccess(ctx)

    const blog = await ctx.db.get(blogId)
    if (!blog) return null

    const trip = await getTripFromTripId(ctx, blog.tripId)

    const member: Doc<"member"> | null = await ctx.runQuery(
      components.betterAuth.adapter.findOne,
      {
        model: "member",
        where: [
          { field: "userId", value: user._id, operator: "eq" },
          { field: "organizationId", value: trip.orgId, operator: "eq" },
        ],
      }
    )
    const isOwner = member?.role === "owner"

    return { ...blog, isOwner }
  },
})

export const upsert = mutation({
  args: {
    tripId: v.id("trip"),
    title: v.string(),
    content: v.string(),
    coverImage: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("published")),
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
    }

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...fields,
        ...denormalized,
        publishedAt:
          fields.status === "published" && existing.status !== "published"
            ? now
            : existing.publishedAt,
        updatedAt: now,
      })
      return existing._id
    } else {
      const blogId = await ctx.db.insert("blog", {
        tripId,
        ...fields,
        ...denormalized,
        publishedAt: fields.status === "published" ? now : undefined,
        updatedAt: now,
      })
      return blogId
    }

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
        .withIndex("blogId", (q) => q.eq("blogId", blog._id))
        .collect()
      await Promise.all(comments.map((c) => ctx.db.delete(c._id)))

      await ctx.db.delete(blog._id)
    }

    await ctx.db.patch(tripId, { updatedAt: Date.now() })
  },
})
