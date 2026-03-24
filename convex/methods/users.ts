import { query } from "../_generated/server";
import { components } from "../_generated/api";
import type { Doc } from "../betterAuth/_generated/dataModel";

export const currentUser = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const user: Doc<"user"> | null = await ctx.runQuery(
            components.betterAuth.adapter.findOne,
            {
                model: "user",
                where: [
                    { field: "_id", value: identity.subject, operator: "eq" },
                ],
            }
        );

        return user;
    },
});
