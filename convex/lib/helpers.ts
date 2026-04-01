import { ConvexError } from "convex/values";
import type { Doc, Id, TableNames } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../_generated/server";

export async function getOrThrow<T extends TableNames>(
    ctx: QueryCtx | MutationCtx,
    id: Id<T>,
    label: string = "Record"
): Promise<Doc<T>> {
    const doc = await ctx.db.get(id);
    if (!doc)
        throw new ConvexError({
            code: "NOT_FOUND",
            message: `${label} not found`,
        });
    return doc;
}

export function requireOwnerOrAdmin(
    ownerId: string,
    userId: string,
    role: string,
    label: string = "resource"
) {
    if (ownerId !== userId && role !== "owner")
        throw new ConvexError({
            code: "FORBIDDEN",
            message: `Not authorized to modify this ${label}`,
        });
}
