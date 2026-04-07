import { ConvexError } from "convex/values";
import { rateLimiter, type RateLimitName } from "../rateLimiter";
import type { MutationCtx } from "../_generated/server";

export async function rateLimit(
    ctx: MutationCtx,
    name: RateLimitName,
    userId: string
) {
    const { ok, retryAfter } = await rateLimiter.limit(ctx, name, {
        key: userId,
    });

    if (!ok) {
        throw new ConvexError({
            code: "RATE_LIMITED",
            message: `Too many requests. Try again in ${Math.ceil(retryAfter / 1000)}s.`,
            retryAfter,
        });
    }
}
