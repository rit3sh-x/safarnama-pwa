import { query } from "../_generated/server";
import { v } from "convex/values";

export const getUsersByIds = query({
    args: {
        userIds: v.array(v.id("user")),
    },
    handler: async (ctx, { userIds }) => {
        if (userIds.length === 0) return [];

        const users = await Promise.all(userIds.map((id) => ctx.db.get(id)));

        return users
            .filter((u): u is NonNullable<typeof u> => u !== null)
            .map((u) => ({
                userId: u._id,
                username: (u.username as string) ?? "Anonymous",
                image: u.image ?? null,
            }));
    },
});
