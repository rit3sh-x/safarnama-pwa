import { v } from "convex/values";
import { query } from "../_generated/server";
import { requireUserAccess } from "../lib/utils";
import { components } from "../_generated/api";
import type { Doc } from "../betterAuth/_generated/dataModel";
import type { PaginationResult } from "convex/server";

export const searchUsers = query({
    args: {
        query: v.string(),
        excludeUserIds: v.optional(v.array(v.string())),
    },
    handler: async (ctx, { query: searchQuery, excludeUserIds }) => {
        await requireUserAccess(ctx);

        const term = searchQuery.trim();
        if (!term) return [];

        const users: PaginationResult<Doc<"user">> = await ctx.runQuery(
            components.betterAuth.adapter.findMany,
            {
                model: "user",
                where: [
                    {
                        field: "name",
                        value: term,
                        operator: "contains" as const,
                        connector: "OR",
                    },
                    {
                        field: "username",
                        value: term,
                        operator: "contains" as const,
                    },
                ],
                paginationOpts: { numItems: 30, cursor: null },
            }
        );

        const excludeSet = new Set(excludeUserIds ?? []);
        const results: Array<{
            id: string;
            name: string;
            username: string;
            image?: string | null;
        }> = [];

        for (const u of users.page) {
            if (excludeSet.has(u._id)) continue;
            if (!u.username) continue;

            results.push({
                id: u._id,
                name: u.name,
                username: u.username,
                image: u.image,
            });
        }

        return results.slice(0, 15);
    },
});
