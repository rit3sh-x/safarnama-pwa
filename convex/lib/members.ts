import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import type { Doc } from "../betterAuth/_generated/dataModel";
import { components } from "../_generated/api";
import type { PaginationResult } from "convex/server";

export async function findMember(
    ctx: QueryCtx | MutationCtx,
    userId: string,
    orgId: string
): Promise<Doc<"member"> | null> {
    return ctx.runQuery(components.betterAuth.adapter.findOne, {
        model: "member",
        where: [
            { field: "userId", value: userId, operator: "eq" },
            { field: "organizationId", value: orgId, operator: "eq" },
        ],
    });
}

export async function getUserMap(
    ctx: QueryCtx | MutationCtx,
    userIds: string[]
): Promise<Map<string, Doc<"user">>> {
    const unique = [...new Set(userIds)];
    if (unique.length === 0) return new Map();

    const result: PaginationResult<Doc<"user">> = await ctx.runQuery(
        components.betterAuth.adapter.findMany,
        {
            model: "user",
            where: [
                {
                    field: "_id",
                    value: unique,
                    operator: "in" as const,
                    connector: "AND" as const,
                },
            ],
            paginationOpts: {
                numItems: unique.length + 10,
                cursor: null,
            },
        }
    );

    return new Map(result.page.map((u) => [u._id, u]));
}

export async function removeMemberFromTrip(
    ctx: MutationCtx,
    memberId: string,
    tripId: Id<"trip">,
    userId: string
) {
    await ctx.runMutation(components.betterAuth.adapter.deleteOne, {
        input: {
            model: "member",
            where: [{ field: "_id", value: memberId, operator: "eq" }],
        },
    });

    const tripMember = await ctx.db
        .query("tripMember")
        .filter((q) =>
            q.and(
                q.eq(q.field("tripId"), tripId),
                q.eq(q.field("userId"), userId)
            )
        )
        .unique();
    if (tripMember) await ctx.db.delete(tripMember._id);
}
