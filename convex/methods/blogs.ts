import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import {
    requireTripAdmin,
    requireUserAccess,
    getTripFromTripId,
} from "../lib/utils";
import { rateLimit } from "../lib/rateLimit";
import { components } from "../_generated/api";
import { paginationOptsValidator } from "convex/server";
import type { Doc } from "../betterAuth/_generated/dataModel";
import type { Doc as SchemaDoc } from "../_generated/dataModel";
import type { RatingValue } from "../types";

export const browse = query({
    args: {
        search: v.optional(v.string()),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, { search, paginationOpts }) => {
        await requireUserAccess(ctx);
        const searchTerm = search?.trim();

        const enrichWithRatings = async (blogs: SchemaDoc<"blog">[]) => {
            return Promise.all(
                blogs.map(async (blog) => {
                    const ratings = await ctx.db
                        .query("blogRating")
                        .withIndex("blogId", (q) => q.eq("blogId", blog._id))
                        .collect();
                    const total = ratings.length;
                    const avg =
                        total > 0
                            ? Math.round(
                                  (ratings.reduce((s, r) => s + r.rating, 0) /
                                      total) *
                                      10
                              ) / 10
                            : 0;
                    return { ...blog, avgRating: avg, totalRatings: total };
                })
            );
        };

        const results = searchTerm
            ? await ctx.db
                  .query("blog")
                  .withSearchIndex("search", (qb) =>
                      qb.search("title", searchTerm)
                  )
                  .paginate(paginationOpts)
            : await ctx.db.query("blog").order("desc").paginate(paginationOpts);

        const enrichedPage = await enrichWithRatings(results.page);
        return { ...results, page: enrichedPage };
    },
});

export const get = query({
    args: { tripId: v.id("trip") },
    handler: async (ctx, { tripId }) => {
        await requireUserAccess(ctx);
        const blog = await ctx.db
            .query("blog")
            .withIndex("tripId", (q) => q.eq("tripId", tripId))
            .unique();

        return blog;
    },
});

export const getById = query({
    args: { blogId: v.id("blog") },
    handler: async (ctx, { blogId }) => {
        const user = await requireUserAccess(ctx);

        const blog = await ctx.db.get(blogId);
        if (!blog) return null;

        const trip = await getTripFromTripId(ctx, blog.tripId);

        const member: Doc<"member"> | null = await ctx.runQuery(
            components.betterAuth.adapter.findOne,
            {
                model: "member",
                where: [
                    { field: "userId", value: user._id, operator: "eq" },
                    {
                        field: "organizationId",
                        value: trip.orgId,
                        operator: "eq",
                    },
                ],
            }
        );
        const isOwner = member?.role === "owner";

        const ratings = await ctx.db
            .query("blogRating")
            .withIndex("blogId", (q) => q.eq("blogId", blogId))
            .collect();
        const totalRatings = ratings.length;
        const avgRating =
            totalRatings > 0
                ? Math.round(
                      (ratings.reduce((s, r) => s + r.rating, 0) /
                          totalRatings) *
                          10
                  ) / 10
                : 0;
        const distribution = ratings.reduce<Record<RatingValue, number>>(
            (acc, r) => ({
                ...acc,
                [r.rating]: (acc[r.rating as RatingValue] ?? 0) + 1,
            }),
            { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        );
        const userRating =
            ratings.find((r) => r.userId === user._id)?.rating ?? null;

        return {
            ...blog,
            isOwner,
            tripIsPublic: trip.isPublic,
            avgRating,
            totalRatings,
            distribution,
            userRating,
        };
    },
});

export const upsert = mutation({
    args: {
        tripId: v.id("trip"),
        title: v.string(),
        content: v.string(),
        coverImage: v.optional(v.string()),
    },
    handler: async (ctx, { tripId, ...fields }) => {
        const { user } = await requireTripAdmin(ctx, tripId);
        await rateLimit(ctx, "upsertBlog", user._id);

        const now = Date.now();
        const trip = await getTripFromTripId(ctx, tripId);

        const existing = await ctx.db
            .query("blog")
            .withIndex("tripId", (q) => q.eq("tripId", tripId))
            .unique();

        const denormalized = {
            tripTitle: trip.title,
            tripDestination: trip.destination,
        };

        if (existing) {
            await ctx.db.patch(existing._id, {
                ...fields,
                ...denormalized,
                updatedAt: now,
            });
            return existing._id;
        } else {
            const blogId = await ctx.db.insert("blog", {
                tripId,
                ...fields,
                ...denormalized,
                publishedAt: now,
                updatedAt: now,
            });
            return blogId;
        }
    },
});

export const remove = mutation({
    args: { tripId: v.id("trip") },
    handler: async (ctx, { tripId }) => {
        const { user } = await requireTripAdmin(ctx, tripId);
        await rateLimit(ctx, "deleteBlog", user._id);

        const blog = await ctx.db
            .query("blog")
            .withIndex("tripId", (q) => q.eq("tripId", tripId))
            .unique();

        if (blog) {
            const comments = await ctx.db
                .query("blogComment")
                .withIndex("blogId", (q) => q.eq("blogId", blog._id))
                .collect();
            await Promise.all(comments.map((c) => ctx.db.delete(c._id)));

            await ctx.db.delete(blog._id);
        }

        await ctx.db.patch(tripId, { updatedAt: Date.now() });
    },
});
