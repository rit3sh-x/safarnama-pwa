import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireTripMember, requireUserAccess } from "../lib/utils";
import { getOrThrow } from "../lib/helpers";
import { paginationOptsValidator } from "convex/server";
import { rateLimit } from "../lib/rateLimit";

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
    },
    handler: async (ctx, { tripId, dayId, ...fields }) => {
        const { user } = await requireTripMember(ctx, tripId);
        await rateLimit(ctx, "addPlace", user._id);

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

export const recommended = query({
    args: {},
    handler: async (ctx) => {
        await requireUserAccess(ctx);
        const publicTrips = await ctx.db
            .query("trip")
            .withIndex("isPublic", (q) => q.eq("isPublic", true))
            .take(20);

        if (publicTrips.length === 0) return [];

        const allPlaces: Array<{
            _id: string;
            name: string;
            lat?: number;
            lng?: number;
            address?: string;
            imageUrl?: string;
            tripDestination: string;
        }> = [];

        for (const trip of publicTrips) {
            const places = await ctx.db
                .query("place")
                .withIndex("tripId", (q) => q.eq("tripId", trip._id))
                .take(5);
            for (const p of places) {
                if (p.lat !== undefined && p.lng !== undefined) {
                    allPlaces.push({
                        _id: p._id,
                        name: p.name,
                        lat: p.lat,
                        lng: p.lng,
                        address: p.address,
                        imageUrl: p.imageUrl,
                        tripDestination: trip.destination,
                    });
                }
            }
        }

        for (let i = allPlaces.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allPlaces[i], allPlaces[j]] = [allPlaces[j], allPlaces[i]];
        }

        return allPlaces.slice(0, 10);
    },
});

export const getPublic = query({
    args: { placeId: v.id("place") },
    handler: async (ctx, { placeId }) => {
        await requireUserAccess(ctx);
        const place = await ctx.db.get(placeId);
        if (!place) return null;
        const trip = await ctx.db.get(place.tripId);
        if (!trip || !trip.isPublic) return null;
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
    },
    handler: async (ctx, { placeId, ...fields }) => {
        const place = await getOrThrow(ctx, placeId, "Place");
        const { user } = await requireTripMember(ctx, place.tripId);
        await rateLimit(ctx, "updatePlace", user._id);
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
        const { user } = await requireTripMember(ctx, place.tripId);
        await rateLimit(ctx, "movePlace", user._id);

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
        const { user } = await requireTripMember(ctx, day.tripId);
        await rateLimit(ctx, "reorderPlaces", user._id);

        await Promise.all(
            placeIds.map((placeId, i) => ctx.db.patch(placeId, { order: i }))
        );
    },
});

export const remove = mutation({
    args: { placeId: v.id("place") },
    handler: async (ctx, { placeId }) => {
        const place = await getOrThrow(ctx, placeId, "Place");
        const { user } = await requireTripMember(ctx, place.tripId);
        await rateLimit(ctx, "deletePlace", user._id);
        await ctx.db.delete(placeId);
    },
});
