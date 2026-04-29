import { ConvexError, v } from "convex/values";
import {
    query,
    mutation,
    internalMutation,
    internalQuery,
} from "../_generated/server";
import { internal } from "../_generated/api";
import { requireUserAccess } from "../lib/utils";
import { getOrThrow } from "../lib/helpers";
import { rateLimit } from "../lib/rateLimit";
import { components } from "../_generated/api";
import type { Doc } from "../betterAuth/_generated/dataModel";

export const notificationTypeValidator = v.union(
    v.literal("message"),
    v.literal("expense"),
    v.literal("join_request"),
    v.literal("poll"),
    v.literal("comment"),
    v.literal("settlement"),
    v.literal("member_joined")
);

export const createNotification = internalMutation({
    args: {
        userId: v.string(),
        type: notificationTypeValidator,
        tripId: v.id("trip"),
        referenceId: v.optional(v.string()),
        title: v.string(),
        body: v.string(),
        url: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const notificationId = await ctx.db.insert("notification", {
            ...args,
            isRead: false,
            createdAt: Date.now(),
        });

        await ctx.scheduler.runAfter(0, internal.methods.nodes.sendPush, {
            userId: args.userId,
            title: args.title,
            body: args.body,
            url: args.url,
        });

        return notificationId;
    },
});

export const notifyTripMembers = internalMutation({
    args: {
        tripId: v.id("trip"),
        excludeUserId: v.string(),
        type: notificationTypeValidator,
        referenceId: v.optional(v.string()),
        title: v.string(),
        body: v.string(),
        url: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const trip = await ctx.db.get(args.tripId);
        if (!trip) return;

        const memberIds: Doc<"member">[] = await ctx.runQuery(
            components.betterAuth.methods.orgs.listOrgMemberIds,
            { organizationId: trip.orgId }
        );

        const now = Date.now();
        const userIds: string[] = [];

        for (const member of memberIds) {
            if (member.userId === args.excludeUserId) continue;
            userIds.push(member.userId);
            await ctx.db.insert("notification", {
                userId: member.userId,
                type: args.type,
                tripId: args.tripId,
                referenceId: args.referenceId,
                title: args.title,
                body: args.body,
                url: args.url,
                isRead: false,
                createdAt: now,
            });
        }

        for (const userId of userIds) {
            await ctx.scheduler.runAfter(0, internal.methods.nodes.sendPush, {
                userId,
                title: args.title,
                body: args.body,
                url: args.url,
            });
        }
    },
});

export const getUserSubscriptions = internalQuery({
    args: { userId: v.string() },
    handler: async (ctx, { userId }) => {
        return ctx.db
            .query("pushSubscription")
            .withIndex("userId", (q) => q.eq("userId", userId))
            .collect();
    },
});

export const countUnreadForUser = internalQuery({
    args: { userId: v.string() },
    handler: async (ctx, { userId }) => {
        const unread = await ctx.db
            .query("notification")
            .withIndex("userId_isRead", (q) =>
                q.eq("userId", userId).eq("isRead", false)
            )
            .collect();
        return unread.length;
    },
});

export const removeSubscription = internalMutation({
    args: { subscriptionId: v.id("pushSubscription") },
    handler: async (ctx, { subscriptionId }) => {
        await ctx.db.delete(subscriptionId);
    },
});

export const subscribe = mutation({
    args: {
        endpoint: v.string(),
        p256dh: v.string(),
        auth: v.string(),
    },
    handler: async (ctx, { endpoint, p256dh, auth }) => {
        const user = await requireUserAccess(ctx);
        await rateLimit(ctx, "pushSubscribe", user._id);

        const existing = await ctx.db
            .query("pushSubscription")
            .withIndex("endpoint", (q) => q.eq("endpoint", endpoint))
            .unique();

        if (existing) return existing._id;

        return ctx.db.insert("pushSubscription", {
            userId: user._id,
            endpoint,
            p256dh,
            auth,
            createdAt: Date.now(),
        });
    },
});

export const unsubscribe = mutation({
    args: { endpoint: v.string() },
    handler: async (ctx, { endpoint }) => {
        const user = await requireUserAccess(ctx);
        await rateLimit(ctx, "pushUnsubscribe", user._id);
        const sub = await ctx.db
            .query("pushSubscription")
            .withIndex("endpoint", (q) => q.eq("endpoint", endpoint))
            .unique();

        if (sub && sub.userId === user._id) {
            await ctx.db.delete(sub._id);
        }
    },
});

export const list = query({
    args: {},
    handler: async (ctx) => {
        const user = await requireUserAccess(ctx);
        return ctx.db
            .query("notification")
            .withIndex("userId", (q) => q.eq("userId", user._id))
            .order("desc")
            .take(50);
    },
});

export const unreadCount = query({
    args: {},
    handler: async (ctx) => {
        const user = await requireUserAccess(ctx);
        const unread = await ctx.db
            .query("notification")
            .withIndex("userId_isRead", (q) =>
                q.eq("userId", user._id).eq("isRead", false)
            )
            .collect();
        return unread.length;
    },
});

export const markAsRead = mutation({
    args: { notificationId: v.id("notification") },
    handler: async (ctx, { notificationId }) => {
        const user = await requireUserAccess(ctx);
        await rateLimit(ctx, "markNotificationRead", user._id);
        const notification = await getOrThrow(
            ctx,
            notificationId,
            "Notification"
        );
        if (notification.userId !== user._id) {
            throw new ConvexError({
                code: "NOT_FOUND",
                message: "Notification not found",
            });
        }
        await ctx.db.patch(notificationId, { isRead: true });
    },
});

export const markAllAsRead = mutation({
    args: {},
    handler: async (ctx) => {
        const user = await requireUserAccess(ctx);
        await rateLimit(ctx, "markAllNotificationsRead", user._id);
        const unread = await ctx.db
            .query("notification")
            .withIndex("userId_isRead", (q) =>
                q.eq("userId", user._id).eq("isRead", false)
            )
            .collect();

        await Promise.all(
            unread.map((n) => ctx.db.patch(n._id, { isRead: true }))
        );
    },
});

export const cleanupOldNotifications = internalMutation({
    args: {},
    handler: async (ctx) => {
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const old = await ctx.db
            .query("notification")
            .withIndex("createdAt", (q) => q.lt("createdAt", thirtyDaysAgo))
            .take(500);

        await Promise.all(old.map((n) => ctx.db.delete(n._id)));
    },
});
