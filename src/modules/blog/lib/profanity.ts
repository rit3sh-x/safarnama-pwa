import type { ProfanitySeverity } from "allprofanity";

type ProfanityPosition = { word: string; start: number; end: number };

export interface ProfanityResult {
    hasProfanity: boolean;
    severity: ProfanitySeverity;
    detectedWords: string[];
    positions: ProfanityPosition[];
}

let profanityInstance: typeof import("allprofanity").default | null = null;

async function getInstance() {
    if (profanityInstance) return profanityInstance;
    const mod = await import("allprofanity");
    const profanity = mod.default;
    profanity.loadLanguages([
        "english",
        "french",
        "german",
        "spanish",
        "hinglish",
    ]);
    profanity.loadIndianLanguages();
    profanityInstance = profanity;
    return profanity;
}

export async function preloadProfanity() {
    await getInstance();
}

export async function checkProfanity(text: string): Promise<ProfanityResult> {
    const profanity = await getInstance();
    const result = profanity.detect(text);
    return {
        hasProfanity: result.hasProfanity,
        severity: result.severity,
        detectedWords: result.detectedWords,
        positions: result.positions,
    };
}
