import profanity, { ProfanitySeverity } from "allprofanity"

profanity.loadLanguages(["english", "french", "german", "spanish", "hinglish"])
profanity.loadIndianLanguages()

export function checkProfanity(text: string): {
  hasProfanity: boolean
  severity: ProfanitySeverity
} {
  const result = profanity.detect(text)
  return {
    hasProfanity: result.hasProfanity,
    severity: result.severity,
  }
}
