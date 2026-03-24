import { MAX_FILE_SIZE } from "../lib/constants";
import { mutation } from "../_generated/server";
import { ConvexError, v } from "convex/values";

export const generateUploadUrl = mutation(async (ctx) => {
    return await ctx.storage.generateUploadUrl();
});

export const confirmUpload = mutation({
    args: { storageId: v.id("_storage") },
    handler: async (ctx, { storageId }) => {
        const metadata = await ctx.db.system.get("_storage", storageId);

        if (!metadata) {
            throw new ConvexError({
                code: "NOT_FOUND",
                message: "File not found",
            });
        }

        if (metadata.size > MAX_FILE_SIZE) {
            await ctx.storage.delete(storageId);
            throw new ConvexError({
                code: "BAD_REQUEST",
                message: "File exceeds 1 MB limit — deleted",
            });
        }

        const url = await ctx.storage.getUrl(storageId);

        return { storageId, url };
    },
});
