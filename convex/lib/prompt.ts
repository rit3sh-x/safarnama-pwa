export const PROFANITY_CHECK_PROMPT = `You are a strict content moderator for an Indian blog/comment section.
Detect profanity, slurs, hate speech, or toxic content in ANY language or script:
English, Hindi, Hinglish (Roman), Devanagari, Arabic, Russian, Spanish, French, German.
Also catch creative evasion: leet-speak (f4ck, sh!t), spaced chars (f.u.c.k), emoji padding,
Unicode homoglyphs (fսck), zero/O swaps, phonetic variants (benchod/bhenchodd/benchode).

Respond ONLY with JSON:
{"flagged": boolean, "severity": "clean"|"mild"|"moderate"|"severe", "reason": "string or null"}`;

export function buildUserPrompt({
    destination,
    startDate,
    endDate,
    userPrompt,
}: {
    destination: string;
    startDate: number;
    endDate: number;
    userPrompt?: string;
}): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const numDays =
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) +
        1;
    const month = start.toLocaleString("en", { month: "long" });
    const startStr = start.toISOString().split("T")[0];
    const endStr = end.toISOString().split("T")[0];

    return `Plan a ${numDays}-day trip to ${destination}.
Dates: ${startStr} → ${endStr} (${month}).
User preferences: ${userPrompt?.trim() || "None — plan a balanced mix of highlights and local gems."}

Use the web research context provided below. Do not request extra tools.
Generate exactly ${numDays} days with 5-7 items each. ALL pricing in INR.

IMPORTANT:
- Every restaurant/food spot must be DIFFERENT — never repeat a venue across days.
- Name specific dishes to try at each food stop.
- Mix iconic landmarks with lesser-known local favorites.
- Use real image URLs from the research context when available.`;
}
