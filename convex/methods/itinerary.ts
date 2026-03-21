import { internalMutation } from "../_generated/server"
import { v } from "convex/values"

export const saveDay = internalMutation({
  args: {
    tripId: v.id("trip"),
    day: v.number(),
    date: v.string(),
    dayTheme: v.optional(v.string()),
    items: v.array(
      v.object({
        time: v.string(),
        duration: v.string(),
        category: v.union(
          v.literal("food"),
          v.literal("activity"),
          v.literal("transport"),
          v.literal("accommodation"),
          v.literal("shopping"),
          v.literal("other")
        ),
        title: v.string(),
        description: v.string(),
        location: v.string(),
        pricing: v.object({
          amount: v.number(),
          currency: v.string(),
          note: v.string(),
        }),
        weather: v.string(),
        tips: v.array(v.string()),
        imageUrl: v.string(),
        imageSource: v.optional(v.string()),
        rating: v.optional(v.number()),
        bookingUrl: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("itinerary", args)
  },
})

export const updateItineraryStatus = internalMutation({
  args: {
    tripId: v.id("trip"),
    status: v.union(
      v.literal("empty"),
      v.literal("planning"),
      v.literal("done"),
      v.literal("error")
    ),
  },
  handler: async (ctx, { tripId, status }) => {
    await ctx.db.patch(tripId, { itineraryStatus: status })
  },
})

export const deleteExistingItinerary = internalMutation({
  args: { tripId: v.id("trip") },
  handler: async (ctx, { tripId }) => {
    const existing = await ctx.db
      .query("itinerary")
      .withIndex("by_trip", (q) => q.eq("tripId", tripId))
      .collect()
    await Promise.all(existing.map((doc) => ctx.db.delete(doc._id)))
  },
})
