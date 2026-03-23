import profanity, { ProfanitySeverity } from "allprofanity"
import { BLOCKED_WORDS } from "./constants"

let initialized = false

function getProfanity() {
  if (!initialized) {
    profanity.loadLanguages(["english", "french", "german", "spanish", "hindi"])
    profanity.loadIndianLanguages()
    profanity.add(BLOCKED_WORDS)
    initialized = true
  }
  return profanity
}

export function checkProfanity(text: string): {
  hasProfanity: boolean
  severity: ProfanitySeverity
} {
  const result = getProfanity().detect(text)
  return {
    hasProfanity: result.hasProfanity,
    severity: result.severity,
  }
}

export function extractTextFromTiptap(json: string): string {
  try {
    const doc = JSON.parse(json)
    const texts: string[] = []

    function walk(node: { type?: string; text?: string; content?: unknown[] }) {
      if (node.text) texts.push(node.text)
      if (Array.isArray(node.content)) {
        for (const child of node.content) {
          walk(child as { type?: string; text?: string; content?: unknown[] })
        }
      }
    }

    walk(doc)
    return texts.join(" ")
  } catch {
    return json
  }
}