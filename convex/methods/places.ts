import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireTripMember } from "../lib/utils";
import { getOrThrow } from "../lib/helpers";
import { paginationOptsValidator } from "convex/server";

export const add = mutation({
    args: {
        tripId: v.id("trip"),
        dayId: v.optional(v.id("day")),
        name: v.string(),
        description: v.optional(v.string()),
        lat: v.optional(v.number()),
        lng: v.optional(v.number()),
        address: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
        osmId: v.optional(v.string()),
        placeTime: v.optional(v.number()),
        endTime: v.optional(v.number()),
    },
    handler: async (ctx, { tripId, dayId, ...fields }) => {
        await requireTripMember(ctx, tripId);

        if (dayId) {
            const day = await ctx.db.get(dayId);
            if (!day || day.tripId !== tripId)
                throw new ConvexError({
                    code: "BAD_REQUEST",
                    message: "Day not found in this trip",
                });
        }

        return ctx.db.insert("place", {
            tripId,
            dayId,
            ...fields,
        });
    },
});

export const list = query({
    args: {
        tripId: v.id("trip"),
        paginationOpts: paginationOptsValidator,
        search: v.optional(v.string()),
    },
    handler: async (ctx, { tripId, paginationOpts, search }) => {
        await requireTripMember(ctx, tripId);

        const results = await ctx.db
            .query("place")
            .withIndex("tripId", (q) => q.eq("tripId", tripId))
            .paginate(paginationOpts);

        if (search) {
            const s = search.toLowerCase();
            results.page = results.page.filter(
                (p) =>
                    p.name.toLowerCase().includes(s) ||
                    (p.address ?? "").toLowerCase().includes(s) ||
                    (p.description ?? "").toLowerCase().includes(s)
            );
        }

        return results;
    },
});

export const listByDay = query({
    args: {
        tripId: v.id("trip"),
        dayId: v.id("day"),
    },
    handler: async (ctx, { tripId, dayId }) => {
        await requireTripMember(ctx, tripId);
        const places = await ctx.db
            .query("place")
            .withIndex("dayId", (q) => q.eq("dayId", dayId))
            .collect();
        return places.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    },
});

export const get = query({
    args: { placeId: v.id("place") },
    handler: async (ctx, { placeId }) => {
        const place = await getOrThrow(ctx, placeId, "Place");
        await requireTripMember(ctx, place.tripId);
        return place;
    },
});

export const update = mutation({
    args: {
        placeId: v.id("place"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        lat: v.optional(v.number()),
        lng: v.optional(v.number()),
        address: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
        osmId: v.optional(v.string()),
        placeTime: v.optional(v.number()),
        endTime: v.optional(v.number()),
    },
    handler: async (ctx, { placeId, ...fields }) => {
        const place = await getOrThrow(ctx, placeId, "Place");
        await requireTripMember(ctx, place.tripId);
        await ctx.db.patch(placeId, fields);
    },
});

export const assignToDay = mutation({
    args: {
        placeId: v.id("place"),
        dayId: v.optional(v.id("day")),
    },
    handler: async (ctx, { placeId, dayId }) => {
        const place = await getOrThrow(ctx, placeId, "Place");
        await requireTripMember(ctx, place.tripId);

        if (dayId) {
            const day = await ctx.db.get(dayId);
            if (!day || day.tripId !== place.tripId)
                throw new ConvexError({
                    code: "BAD_REQUEST",
                    message: "Day not found in this trip",
                });
        }

        await ctx.db.patch(placeId, { dayId: dayId ?? undefined });
    },
});

export const reorder = mutation({
    args: {
        dayId: v.id("day"),
        placeIds: v.array(v.id("place")),
    },
    handler: async (ctx, { dayId, placeIds }) => {
        const day = await getOrThrow(ctx, dayId, "Day");
        await requireTripMember(ctx, day.tripId);

        await Promise.all(
            placeIds.map((placeId, i) => ctx.db.patch(placeId, { order: i }))
        );
    },
});

export const remove = mutation({
    args: { placeId: v.id("place") },
    handler: async (ctx, { placeId }) => {
        const place = await getOrThrow(ctx, placeId, "Place");
        await requireTripMember(ctx, place.tripId);
        await ctx.db.delete(placeId);
    },
});
