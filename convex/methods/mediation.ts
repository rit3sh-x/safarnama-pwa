"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import Groq from "groq-sdk";
import { PROFANITY_CHECK_PROMPT } from "convex/lib/prompt";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const advancedModerate = internalAction({
    args: { text: v.string() },
    handler: async (_ctx, { text }) => {
        const completion = await groq.chat.completions.create({
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            max_tokens: 120,
            temperature: 0,
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "system",
                    content: PROFANITY_CHECK_PROMPT,
                },
                {
                    role: "user",
                    content: text,
                },
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