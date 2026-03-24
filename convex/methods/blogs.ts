import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";
import {
    requireTripAdmin,
    requireUserAccess,
    getTripFromTripId,
} from "../lib/utils";
import { components } from "../_generated/api";
import { paginationOptsValidator } from "convex/server";
import type { Doc } from "../betterAuth/_generated/dataModel";
import type { RatingValue } from "../types";
import { checkProfanity, extractTextFromTiptap } from "../lib/profanity";

export const browse = query({
    args: {
        search: v.optional(v.string()),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, { search, paginationOpts }) => {
        await requireUserAccess(ctx);
        const searchTerm = search?.trim();

        const enrichWithRatings = async (blogs: typeof results.page) => {
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

        if (searchTerm) {
            const results = await ctx.db
                .query("blog")
                .withSearchIndex("search", (qb) =>
                    qb.search("title", searchTerm).eq("status", "published")
                )
                .take(paginationOpts.numItems);

            const enriched = await enrichWithRatings(results);
            return { page: enriched, isDone: true, continueCursor: "" };
        }

        const results = await ctx.db
            .query("blog")
            .filter((q) => q.and(q.eq(q.field("status"), "published")))
            .order("desc")
            .paginate(paginationOpts);

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

        if (blog?.status === "published") return blog;
        return null;
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
        status: v.union(v.literal("draft"), v.literal("published")),
    },
    handler: async (ctx, { tripId, ...fields }) => {
        await requireTripAdmin(ctx, tripId);

        if (fields.status === "published") {
            const titleCheck = checkProfanity(fields.title);
            if (titleCheck.hasProfanity)
                throw new ConvexError("Title contains inappropriate language");
            const textContent = extractTextFromTiptap(fields.content);
            const contentCheck = checkProfanity(textContent);
            if (contentCheck.hasProfanity)
                throw new ConvexError(
                    "Content contains inappropriate language"
                );
        }

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
                publishedAt:
                    fields.status === "published" &&
                    existing.status !== "published"
                        ? now
                        : existing.publishedAt,
                updatedAt: now,
            });
            return existing._id;
        } else {
            const blogId = await ctx.db.insert("blog", {
                tripId,
                ...fields,
                ...denormalized,
                publishedAt: fields.status === "published" ? now : undefined,
                updatedAt: now,
            });
            return blogId;
        }
    },
});

export const remove = mutation({
    args: { tripId: v.id("trip") },
    handler: async (ctx, { tripId }) => {
        await requireTripAdmin(ctx, tripId);

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
