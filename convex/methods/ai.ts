import { internalAction, internalMutation } from "../_generated/server"
import { internal } from "../_generated/api"
import { ConvexError, v } from "convex/values"
import OpenAI from "openai"
import { SYSTEM_PROMPT, buildUserPrompt } from "../lib/prompt"
import { coerceItem, extractJson } from "../lib/utils"
import type { RawItem } from "../lib/types"

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
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

export const planTrip = internalAction({
  args: {
    tripId: v.id("trip"),
    destination: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    userPrompt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.methods.ai.deleteExistingItinerary, {
      tripId: args.tripId,
    })

    const response = await client.responses.create({
      model: "openai/gpt-oss-120b",
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(args) },
      ],
      tools: [{ type: "web_search" }],
      tool_choice: "required",
    })

    const rawText = response.output_text
    if (!rawText)
      throw new ConvexError({
        code: "INTERNAL",
        message: "Model returned empty response",
      })

    let plan: Record<string, unknown>
    try {
      plan = JSON.parse(extractJson(rawText))
    } catch {
      throw new ConvexError({
        code: "INTERNAL",
        message: "Failed to parse AI response as JSON",
      })
    }

    const days = Array.isArray(plan.days) ? plan.days : []

    for (const day of days) {
      const rawItems: RawItem[] = Array.isArray(day.items) ? day.items : []

      await ctx.runMutation(internal.methods.ai.saveDay, {
        tripId: args.tripId,
        day: Number(day.day),
        date: String(day.date),
        dayTheme: day.dayTheme ? String(day.dayTheme) : undefined,
        items: rawItems.map(coerceItem),
      })
    }
  },
})
