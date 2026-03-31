import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireTripMember } from "../lib/utils";

export const list = query({
    args: { tripId: v.id("trip") },
    handler: async (ctx, { tripId }) => {
        await requireTripMember(ctx, tripId);
        return ctx.db
            .query("day")
            .withIndex("tripId", (q) => q.eq("tripId", tripId))
            .collect();
    },
});

export const get = query({
    args: { dayId: v.id("day") },
    handler: async (ctx, { dayId }) => {
        const day = await ctx.db.get(dayId);
        if (!day)
            throw new ConvexError({
                code: "NOT_FOUND",
                message: "Day not found",
            });
        await requireTripMember(ctx, day.tripId);
        return day;
    },
});

export const add = mutation({
    args: {
        tripId: v.id("trip"),
        dayNumber: v.number(),
        date: v.optional(v.string()),
        title: v.optional(v.string()),
        note: v.optional(v.string()),
    },
    handler: async (ctx, { tripId, dayNumber, ...fields }) => {
        await requireTripMember(ctx, tripId);

        const existing = await ctx.db
            .query("day")
            .withIndex("tripId_dayNumber", (q) =>
                q.eq("tripId", tripId).eq("dayNumber", dayNumber)
            )
            .unique();

        if (existing)
            throw new ConvexError({
                code: "BAD_REQUEST",
                message: `Day ${dayNumber} already exists for this trip`,
            });

        return ctx.db.insert("day", {
            tripId,
            dayNumber,
            ...fields,
        });
    },
});

export const upsert = mutation({
    args: {
        tripId: v.id("trip"),
        dayNumber: v.number(),
        date: v.optional(v.string()),
        title: v.optional(v.string()),
        note: v.optional(v.string()),
    },
    handler: async (ctx, { tripId, dayNumber, ...fields }) => {
        await requireTripMember(ctx, tripId);

        const existing = await ctx.db
            .query("day")
            .withIndex("tripId_dayNumber", (q) =>
                q.eq("tripId", tripId).eq("dayNumber", dayNumber)
            )
            .unique();

        if (existing) return existing._id;

        return ctx.db.insert("day", {
            tripId,
            dayNumber,
            ...fields,
        });
    },
});

export const update = mutation({
    args: {
        dayId: v.id("day"),
        title: v.optional(v.string()),
        date: v.optional(v.string()),
        note: v.optional(v.string()),
    },
    handler: async (ctx, { dayId, ...fields }) => {
        const day = await ctx.db.get(dayId);
        if (!day)
            throw new ConvexError({
                code: "NOT_FOUND",
                message: "Day not found",
            });
        await requireTripMember(ctx, day.tripId);
        await ctx.db.patch(dayId, fields);
    },
});

export const remove = mutation({
    args: { dayId: v.id("day") },
    handler: async (ctx, { dayId }) => {
        const day = await ctx.db.get(dayId);
        if (!day)
            throw new ConvexError({
                code: "NOT_FOUND",
                message: "Day not found",
            });
        await requireTripMember(ctx, day.tripId);

        const places = await ctx.db
            .query("place")
            .withIndex("dayId", (q) => q.eq("dayId", dayId))
            .collect();
        await Promise.all(
            places.map((p) => ctx.db.patch(p._id, { dayId: undefined }))
        );

        await ctx.db.delete(dayId);
    },
});

export const addPlaceToDay = mutation({
    args: {
        dayId: v.id("day"),
        placeId: v.id("place"),
    },
    handler: async (ctx, { dayId, placeId }) => {
        const day = await ctx.db.get(dayId);
        if (!day)
            throw new ConvexError({
                code: "NOT_FOUND",
                message: "Day not found",
            });
        await requireTripMember(ctx, day.tripId);

        const place = await ctx.db.get(placeId);
        if (!place || place.tripId !== day.tripId)
            throw new ConvexError({
                code: "BAD_REQUEST",
                message: "Place not found in this trip",
            });

        await ctx.db.patch(placeId, { dayId });
    },
});

export const removePlaceFromDay = mutation({
    args: { placeId: v.id("place") },
    handler: async (ctx, { placeId }) => {
        const place = await ctx.db.get(placeId);
        if (!place)
            throw new ConvexError({
                code: "NOT_FOUND",
                message: "Place not found",
            });
        await requireTripMember(ctx, place.tripId);
        await ctx.db.patch(placeId, { dayId: undefined });
    },
});

export const updateNote = mutation({
    args: {
        dayId: v.id("day"),
        note: v.string(),
    },
    handler: async (ctx, { dayId, note }) => {
        const day = await ctx.db.get(dayId);
        if (!day)
            throw new ConvexError({
                code: "NOT_FOUND",
                message: "Day not found",
            });
        await requireTripMember(ctx, day.tripId);
        await ctx.db.patch(dayId, { note: note || undefined });
    },
});

export const removeNote = mutation({
    args: { dayId: v.id("day") },
    handler: async (ctx, { dayId }) => {
        const day = await ctx.db.get(dayId);
        if (!day)
            throw new ConvexError({
                code: "NOT_FOUND",
                message: "Day not found",
            });
        await requireTripMember(ctx, day.tripId);
        await ctx.db.patch(dayId, { note: undefined });
    },
});
