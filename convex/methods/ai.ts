"use node"

import { internalAction } from "../_generated/server"
import { internal } from "../_generated/api"
import { ConvexError, v } from "convex/values"
import Groq from "groq-sdk"
import { tavily } from "@tavily/core"
import { SYSTEM_PROMPT, buildUserPrompt } from "../lib/prompt"
import { coerceItem, extractJson } from "../lib/utils"
import type { RawItem } from "../lib/types"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY })

async function searchDestination(destination: string, month: string) {
  const queries = [
    `${destination} top attractions things to do ${month}`,
    `${destination} best restaurants street food local cuisine`,
    `${destination} weather ${month} travel tips transportation`,
  ]

  const results = await Promise.all(
    queries.map((q) =>
      tvly.search(q, {
        maxResults: 5,
        includeImages: true,
        includeImageDescriptions: true,
        searchDepth: "advanced",
      })
    )
  )

  const searchContext = results
    .flatMap((r) =>
      r.results.map((item) => `[${item.title}](${item.url})\n${item.content}`)
    )
    .join("\n\n")

  const images = results.flatMap((r) =>
    r.images.map((img) => `${img.url} — ${img.description ?? ""}`)
  )

  return { searchContext, images }
}

export const planTrip = internalAction({
  args: {
    tripId: v.id("trip"),
    destination: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    userPrompt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      await ctx.runMutation(
        internal.methods.itinerary.deleteExistingItinerary,
        {
          tripId: args.tripId,
        }
      )

      const month = new Date(args.startDate).toLocaleString("en", {
        month: "long",
      })

      const { searchContext, images } = await searchDestination(
        args.destination,
        month
      )

      const userPrompt = buildUserPrompt(args)

      const webContext = `\n\n--- WEB RESEARCH ---\n${searchContext}\n\n--- IMAGE URLs FOUND ---\n${images.join("\n")}\n\nUse the above real data and image URLs in your response.`

      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt + webContext },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      })

      const rawText = response.choices[0]?.message?.content
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

        await ctx.runMutation(internal.methods.itinerary.saveDay, {
          tripId: args.tripId,
          day: Number(day.day),
          date: String(day.date),
          dayTheme: day.dayTheme ? String(day.dayTheme) : undefined,
          items: rawItems.map(coerceItem),
        })
      }

      await ctx.runMutation(internal.methods.itinerary.updateItineraryStatus, {
        tripId: args.tripId,
        status: "done",
      })
    } catch (e) {
      console.error("planTrip failed:", e)
      await ctx.runMutation(internal.methods.itinerary.updateItineraryStatus, {
        tripId: args.tripId,
        status: "error",
      })
      throw e
    }
  },
})
