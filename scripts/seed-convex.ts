import { execSync } from "child_process"
import { ENV } from "varlock/env"

const SECRETS: Record<string, string> = {
  BETTER_AUTH_SECRET: ENV.BETTER_AUTH_SECRET,
  GOOGLE_CLIENT_ID: ENV.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: ENV.GOOGLE_CLIENT_SECRET,
  SITE_URL: ENV.SITE_URL,
}

const isProd = process.argv.slice(2).includes("--prod")
const envFlag = isProd ? " --prod" : ""
const convexCmd = "pnpm exec convex"

if (isProd) {
  execSync(convexCmd + " env set NODE_ENV production" + envFlag, {
    stdio: "inherit",
  })
}

console.log(
  "Importing secrets to " + (isProd ? "PRODUCTION" : "DEVELOPMENT") + "..."
)

for (const [name, rawValue] of Object.entries(SECRETS)) {
  if (!rawValue) {
    console.warn("Skipping " + name + ": value not found")
    continue
  }

  const value = rawValue.replace(/"/g, '\\"')

  try {
    execSync(convexCmd + " env set " + name + ' "' + value + '"' + envFlag, {
      stdio: "inherit",
    })
  } catch {
    console.error("Failed to set " + name)
  }
}
