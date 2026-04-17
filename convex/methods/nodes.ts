"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import webpush from "web-push";

export const sendPush = internalAction({
    args: {
        userId: v.string(),
        title: v.string(),
        body: v.string(),
        url: v.optional(v.string()),
    },
    handler: async (ctx, { userId, title, body, url }) => {
        const vapidPublic = process.env.VITE_VAPID_PUBLIC_KEY;
        const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
        const siteUrl = process.env.SITE_URL;

        if (!vapidPublic || !vapidPrivate || !siteUrl) return;

        webpush.setVapidDetails(siteUrl, vapidPublic, vapidPrivate);

        const subscriptions = await ctx.runQuery(
            internal.methods.notifications.getUserSubscriptions,
            { userId }
        );

        const unreadCount = await ctx.runQuery(
            internal.methods.notifications.countUnreadForUser,
            { userId }
        );

        const payload = JSON.stringify({ title, body, url, unreadCount });

        for (const sub of subscriptions) {
            try {
                await webpush.sendNotification(
                    {
                        endpoint: sub.endpoint,
                        keys: { p256dh: sub.p256dh, auth: sub.auth },
                    },
                    payload
                );
            } catch (err: unknown) {
                const error = err as { statusCode?: number };
                if (error.statusCode === 410) {
                    await ctx.runMutation(
                        internal.methods.notifications.removeSubscription,
                        { subscriptionId: sub._id }
                    );
                }
            }
        }
    },
});
