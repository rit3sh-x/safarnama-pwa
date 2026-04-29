import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";
import {
    requireTripAdmin,
    requireTripMember,
    requireTripPermission,
} from "../lib/utils";
import { findMember, removeMemberFromTrip } from "../lib/members";
import { notifyUser } from "../lib/notify";
import { rateLimit } from "../lib/rateLimit";
import { components } from "../_generated/api";
import type { Doc } from "../betterAuth/_generated/dataModel";
import { paginationOptsValidator, type PaginationResult } from "convex/server";

export const listAll = query({
    args: {
        tripId: v.id("trip"),
    },
    handler: async (ctx, { tripId }) => {
        const { trip } = await requireTripMember(ctx, tripId);

        const memberships: Doc<"member">[] = await ctx.runQuery(
            components.betterAuth.methods.orgs.listOrgMemberIds,
            { organizationId: trip.orgId }
        );

        const userIds = memberships.map((m) => m.userId);

        const users: PaginationResult<Doc<"user">> = await ctx.runQuery(
            components.betterAuth.adapter.findMany,
            {
                model: "user",
                where: [
                    {
                        field: "_id",
                        value: userIds,
                        operator: "in",
                    },
                ],
                paginationOpts: {
                    cursor: null,
                    numItems: userIds.length,
                },
            }
        );

        return users.page
            .filter((u) => u.username)
            .map((u) => ({
                userId: u._id,
                name: u.name,
                username: u.username as string,
            }));
    },
});

export const list = query({
    args: {
        tripId: v.id("trip"),
        search: v.optional(v.string()),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, { tripId, search, paginationOpts }) => {
        const { trip } = await requireTripMember(ctx, tripId);

        const memberships: Doc<"member">[] = await ctx.runQuery(
            components.betterAuth.methods.orgs.listOrgMemberIds,
            { organizationId: trip.orgId }
        );

        const userIds = memberships.map((m) => m.userId);

        const users: PaginationResult<Doc<"user">> = await ctx.runQuery(
            components.betterAuth.adapter.findMany,
            {
                model: "user",
                where: [
                    {
                        field: "_id",
                        value: userIds,
                        operator: "in" as const,
                        connector: "AND" as const,
                    },
                    ...(search
                        ? [
                              {
                                  field: "name",
                                  value: search,
                                  operator: "contains" as const,
                              },
                          ]
                        : []),
                ],
                paginationOpts,
            }
        );

        return {
            ...users,
            page: users.page
                .filter((u) => Boolean(u.username))
                .map((u) => ({
                    name: u.name,
                    username: u.username as string,
                    image: u.image,
                    id: u._id,
                })),
        };
    },
});

export const remove = mutation({
    args: {
        tripId: v.id("trip"),
        targetUserId: v.string(),
    },
    handler: async (ctx, { tripId, targetUserId }) => {
        const { trip, user } = await requireTripPermission(
            ctx,
            tripId,
            "member:remove"
        );
        await rateLimit(ctx, "removeMember", user._id);

        if (targetUserId === user._id) {
            throw new ConvexError({
                code: "BAD_REQUEST",
                message: "Cannot remove yourself, use leave instead",
            });
        }

        const target = await findMember(ctx, targetUserId, trip.orgId);
        if (!target)
            throw new ConvexError({
                code: "NOT_FOUND",
                message: "Member not found",
            });
        if (target.role === "owner")
            throw new ConvexError({
                code: "FORBIDDEN",
                message: "Cannot remove an owner",
            });

        await removeMemberFromTrip(ctx, target._id, tripId, targetUserId);

        await ctx.db.insert("message", {
            tripId,
            senderId: user._id,
            type: "member_left",
            content: `removed a member`,
        });

        await notifyUser(ctx, {
            userId: targetUserId,
            type: "member_joined",
            tripId,
            title: trip.title,
            body: `You were removed from ${trip.title}`,
            url: `/trips`,
        });
    },
});

export const leave = mutation({
    args: { tripId: v.id("trip") },
    handler: async (ctx, { tripId }) => {
        const { member, user, trip } = await requireTripMember(ctx, tripId);
        await rateLimit(ctx, "leaveTrip", user._id);

        if (member.role === "owner") {
            const allMembers: PaginationResult<Doc<"member">> =
                await ctx.runQuery(components.betterAuth.adapter.findMany, {
                    model: "member",
                    where: [
                        {
                            field: "organizationId",
                            value: trip.orgId,
                            operator: "eq",
                        },
                    ],
                    paginationOpts: { numItems: 100, cursor: null },
                });

            const otherOwner = allMembers.page.find(
                (m) => m.userId !== user._id && m.role === "owner"
            );

            if (!otherOwner) {
                throw new ConvexError({
                    code: "FORBIDDEN",
                    message:
                        "Assign another admin before leaving or delete trip",
                });
            }
        }

        await removeMemberFromTrip(ctx, member._id, tripId, user._id);

        await ctx.db.insert("message", {
            tripId,
            senderId: user._id,
            type: "member_left",
            content: "left the trip",
        });
    },
});

export const changeRole = mutation({
    args: {
        tripId: v.id("trip"),
        targetUserId: v.string(),
        role: v.union(v.literal("owner"), v.literal("member")),
    },
    handler: async (ctx, { tripId, targetUserId, role }) => {
        const { trip, user } = await requireTripAdmin(ctx, tripId);
        await rateLimit(ctx, "changeRole", user._id);

        const target = await findMember(ctx, targetUserId, trip.orgId);
        if (!target)
            throw new ConvexError({
                code: "NOT_FOUND",
                message: "Member not found",
            });

        await ctx.runMutation(components.betterAuth.adapter.updateOne, {
            input: {
                model: "member",
                where: [{ field: "_id", value: target._id, operator: "eq" }],
                update: { role },
            },
        });
    },
});
