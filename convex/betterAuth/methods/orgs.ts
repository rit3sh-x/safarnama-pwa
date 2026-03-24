import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";

export const listUserMemberships = query({
    args: {
        userId: v.string(),
    },
    handler: async (ctx, { userId }) => {
        const memberships = await ctx.db
            .query("member")
            .withIndex("userId", (q) => q.eq("userId", userId))
            .order("desc")
            .collect();

        return memberships;
    },
});

export const listOrgMemberIds = query({
    args: {
        organizationId: v.string(),
    },
    handler: async (ctx, { organizationId }) => {
        const memberships = await ctx.db
            .query("member")
            .withIndex("organizationId", (q) =>
                q.eq("organizationId", organizationId)
            )
            .collect();

        return memberships;
    },
});

export const countUserMemberships = query({
    args: {
        userId: v.string(),
    },
    handler: async (ctx, { userId }) => {
        const memberships = await ctx.db
            .query("member")
            .withIndex("userId", (q) => q.eq("userId", userId))
            .collect();
        return memberships.length;
    },
});

export const getOrgsByIds = query({
    args: {
        orgIds: v.array(v.string()),
    },
    handler: async (ctx, { orgIds }) => {
        const orgs = await Promise.all(
            orgIds.map((id) => ctx.db.get(id as Id<"organization">))
        );
        return orgs
            .filter((o): o is NonNullable<typeof o> => o !== null)
            .map((o) => ({
                name: o.name,
                id: o._id,
                logo: o.logo,
                updatedAt: o.updatedAt,
            }));
    },
});

export const deleteOrgAndRelated = mutation({
    args: {
        organizationId: v.string(),
    },
    handler: async (ctx, { organizationId }) => {
        const members = await ctx.db
            .query("member")
            .withIndex("organizationId", (q) =>
                q.eq("organizationId", organizationId)
            )
            .collect();
        await Promise.all(members.map((m) => ctx.db.delete(m._id)));

        const invitations = await ctx.db
            .query("invitation")
            .withIndex("organizationId", (q) =>
                q.eq("organizationId", organizationId)
            )
            .collect();
        await Promise.all(invitations.map((inv) => ctx.db.delete(inv._id)));

        const org = await ctx.db.get(organizationId as Id<"organization">);
        if (org) await ctx.db.delete(org._id);
    },
});
