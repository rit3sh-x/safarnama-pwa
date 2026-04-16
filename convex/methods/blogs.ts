import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import type { QueryCtx } from "../_generated/server";
import {
    requireTripAdmin,
    requireUserAccess,
    getTripFromTripId,
} from "../lib/utils";
import { rateLimit } from "../lib/rateLimit";
import { components } from "../_generated/api";
import { paginationOptsValidator } from "convex/server";
import { filter } from "convex-helpers/server/filter";
import type { Doc } from "../betterAuth/_generated/dataModel";
import type { Doc as SchemaDoc, Id } from "../_generated/dataModel";
import type { RatingValue } from "../types";
import { haversineKm } from "../lib/geo";

const DAY_MS = 24 * 60 * 60 * 1000;

type ResolvedPlace = {
    _id: Id<"place">;
    name: string;
    lat?: number;
    lng?: number;
};

async function resolvePlaces(
    ctx: QueryCtx,
    placeIds: Id<"place">[] | undefined
): Promise<ResolvedPlace[]> {
    if (!placeIds || placeIds.length === 0) return [];
    const docs = await Promise.all(placeIds.map((id) => ctx.db.get(id)));
    return docs
        .filter((p): p is NonNullable<typeof p> => p !== null)
        .map((p) => ({ _id: p._id, name: p.name, lat: p.lat, lng: p.lng }));
}

function withBrowseAggregates(blog: SchemaDoc<"blog">) {
    return {
        ...blog,
        avgRating: blog.avgRating ?? 0,
        totalRatings: blog.totalRatings ?? 0,
        placeCount: blog.placeCount ?? blog.placeIds?.length ?? 0,
    };
}

export const browse = query({
    args: {
        search: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
        minBudget: v.optional(v.number()),
        maxBudget: v.optional(v.number()),
        minDays: v.optional(v.number()),
        maxDays: v.optional(v.number()),
        nearLat: v.optional(v.number()),
        nearLng: v.optional(v.number()),
        radiusKm: v.optional(v.number()),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
        await requireUserAccess(ctx);
        const searchTerm = args.search?.trim();

        const origin =
            args.nearLat !== undefined &&
            args.nearLng !== undefined &&
            args.radiusKm !== undefined
                ? { lat: args.nearLat, lng: args.nearLng }
                : null;
        const radiusKm = args.radiusKm;

        const predicate = async (blog: SchemaDoc<"blog">): Promise<boolean> => {
            if (args.tags && args.tags.length > 0) {
                const blogTags = blog.tags ?? [];
                if (!args.tags.some((t) => blogTags.includes(t))) return false;
            }

            if (args.minBudget !== undefined) {
                if (blog.budget === undefined || blog.budget < args.minBudget)
                    return false;
            }
            if (args.maxBudget !== undefined) {
                if (blog.budget === undefined || blog.budget > args.maxBudget)
                    return false;
            }

            if (args.minDays !== undefined || args.maxDays !== undefined) {
                if (blog.startDate === undefined || blog.endDate === undefined)
                    return false;
                const days =
                    Math.floor((blog.endDate - blog.startDate) / DAY_MS) + 1;
                if (args.minDays !== undefined && days < args.minDays)
                    return false;
                if (args.maxDays !== undefined && days > args.maxDays)
                    return false;
            }

            if (origin && radiusKm !== undefined) {
                const coords = blog.placeCoords ?? [];
                const hasNearbyPlace = coords.some(
                    (p) => haversineKm(origin, p) <= radiusKm
                );
                if (!hasNearbyPlace) return false;
            }

            return true;
        };

        const base = searchTerm
            ? ctx.db
                  .query("blog")
                  .withSearchIndex("search", (qb) =>
                      qb.search("title", searchTerm)
                  )
            : ctx.db.query("blog").withIndex("publishedAt").order("desc");

        const hasAnyFilter =
            (args.tags && args.tags.length > 0) ||
            args.minBudget !== undefined ||
            args.maxBudget !== undefined ||
            args.minDays !== undefined ||
            args.maxDays !== undefined ||
            origin !== null;

        const results = hasAnyFilter
            ? await filter(base, predicate).paginate(args.paginationOpts)
            : await base.paginate(args.paginationOpts);

        return {
            ...results,
            page: results.page.map(withBrowseAggregates),
        };
    },
});

export const recommended = query({
    args: {},
    handler: async (ctx) => {
        await requireUserAccess(ctx);
        const top = await ctx.db
            .query("blog")
            .withIndex("publishedAt")
            .order("desc")
            .take(30);

        const sorted = top
            .slice()
            .sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));

        const picked: typeof sorted = [];
        const used = new Set<string>();
        while (picked.length < 10 && picked.length < sorted.length) {
            const idx = Math.floor(Math.random() * Math.min(sorted.length, 20));
            const blog = sorted[idx];
            if (!used.has(blog._id)) {
                used.add(blog._id);
                picked.push(blog);
            }
        }

        return picked.map((b) => ({
            _id: b._id,
            title: b.title,
            coverImage: b.coverImage,
            tripDestination: b.tripDestination,
            avgRating: b.avgRating ?? 0,
            totalRatings: b.totalRatings ?? 0,
            tags: b.tags,
        }));
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

        const [ratings, places] = await Promise.all([
            ctx.db
                .query("blogRating")
                .withIndex("blogId", (q) => q.eq("blogId", blogId))
                .collect(),
            resolvePlaces(ctx, blog.placeIds),
        ]);
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
            places,
        };
    },
});

export const upsert = mutation({
    args: {
        tripId: v.id("trip"),
        title: v.string(),
        content: v.string(),
        coverImage: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
        budget: v.optional(v.number()),
        currency: v.optional(v.string()),
        placeIds: v.optional(v.array(v.id("place"))),
    },
    handler: async (ctx, args) => {
        const { tripId, placeIds, ...fields } = args;
        const { user } = await requireTripAdmin(ctx, tripId);
        await rateLimit(ctx, "upsertBlog", user._id);

        const now = Date.now();
        const trip = await getTripFromTripId(ctx, tripId);

        let verifiedPlaceIds: Id<"place">[] | undefined;
        let verifiedPlaceCoords: { lat: number; lng: number }[] | undefined;
        if (placeIds !== undefined) {
            verifiedPlaceIds = [];
            verifiedPlaceCoords = [];
            for (const pid of placeIds) {
                const p = await ctx.db.get(pid);
                if (!p || p.tripId !== tripId) continue;
                verifiedPlaceIds.push(p._id);
                if (p.lat !== undefined && p.lng !== undefined) {
                    verifiedPlaceCoords.push({ lat: p.lat, lng: p.lng });
                }
            }
        }

        const existing = await ctx.db
            .query("blog")
            .withIndex("tripId", (q) => q.eq("tripId", tripId))
            .unique();

        const denormalized = {
            tripTitle: trip.title,
            tripDestination: trip.destination,
        };

        const placePatch =
            verifiedPlaceIds !== undefined
                ? {
                      placeIds: verifiedPlaceIds,
                      placeCount: verifiedPlaceIds.length,
                      placeCoords: verifiedPlaceCoords,
                  }
                : {};

        if (existing) {
            await ctx.db.patch(existing._id, {
                ...fields,
                ...denormalized,
                ...placePatch,
                updatedAt: now,
            });
            return existing._id;
        } else {
            const blogId = await ctx.db.insert("blog", {
                tripId,
                ...fields,
                ...denormalized,
                ...placePatch,
                publishedAt: now,
                updatedAt: now,
                avgRating: 0,
                totalRatings: 0,
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
