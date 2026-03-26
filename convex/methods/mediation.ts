"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import OpenAI from "openai";
import { PROFANITY_CHECK_PROMPT } from "../lib/prompt";

const client = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
});

export const advancedModerate = internalAction({
    args: { text: v.string() },
    handler: async (_ctx, { text }) => {
        const completion = await client.chat.completions.create({
            model: "nvidia/nemotron-3-nano-30b-a3b:free",
            max_tokens: 120,
            temperature: 0,
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: PROFANITY_CHECK_PROMPT },
                { role: "user", content: text },
            ],
        });

        const raw = completion.choices[0]?.message?.content ?? "{}";

        try {
            const parsed = JSON.parse(raw) as {
                severity?: "clean" | "mild" | "moderate" | "severe";
            };
            return parsed.severity ?? "clean";
        } catch {
            return "clean";
        }
    },
});
