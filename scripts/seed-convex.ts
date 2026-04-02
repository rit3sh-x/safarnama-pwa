import { spawnSync } from "child_process";
import { ENV } from "varlock/env";

const SECRETS: Record<string, string> = {
    BETTER_AUTH_SECRET: ENV.BETTER_AUTH_SECRET,
    GOOGLE_CLIENT_ID: ENV.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: ENV.GOOGLE_CLIENT_SECRET,
    SITE_URL: ENV.SITE_URL,
    VITE_VAPID_PUBLIC_KEY: ENV.VITE_VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY: ENV.VAPID_PRIVATE_KEY,
};

const isProd = process.argv.slice(2).includes("--prod");

function convex(...args: string[]) {
    const result = spawnSync("pnpm", ["exec", "convex", ...args], {
        stdio: "inherit",
        shell: false,
    });
    if (result.status !== 0) throw new Error(`convex ${args.join(" ")} failed`);
}

console.log(`Seeding ${isProd ? "PRODUCTION" : "DEVELOPMENT"}...`);

for (const [name, value] of Object.entries(SECRETS)) {
    if (!value) {
        console.warn(`Skipping ${name}: not set`);
        continue;
    }

    const args = ["env", "set", "--force", name, value];
    if (isProd) args.push("--prod");

    try {
        convex(...args);
    } catch {
        console.error(`Failed to set ${name}`);
    }
}
