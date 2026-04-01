import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";
import {
    requireTripPermission,
    requireUserAccess,
    getTripFromOrgId,
} from "../lib/utils";
import { findMember } from "../lib/members";
import { notifyTrip, notifyUser } from "../lib/notify";
import { components } from "../_generated/api";
import type { Doc } from "../_generated/dataModel";
import type { Doc as DocAuth, Id } from "../betterAuth/_generated/dataModel";
import { LIMITS } from "../lib/constants";
import { paginationOptsValidator } from "convex/server";

export const userSendRequest = mutation({
    args: {
        orgId: v.string(),
        message: v.optional(v.string()),
    },
    handler: async (ctx, { orgId, message }) => {
        const user = await requireUserAccess(ctx);
        const trip = await getTripFromOrgId(ctx, orgId as Id<"organization">);

        if (!trip.isPublic) {
            throw new ConvexError({
                code: "FORBIDDEN",
                message: "Trip is not public",
            });
        }

        const member = await findMember(ctx, user._id, trip.orgId);
        if (member) {
            throw new ConvexError({
                code: "FORBIDDEN",
                message: "Already a member",
            });
        }

        const existingForTrip = await ctx.db
            .query("joinRequest")
            .withIndex("userId_tripId", (q) =>
                q.eq("userId", user._id).eq("tripId", trip._id)
            )
            .collect();

        if (existingForTrip.some((r) => r.status === "pending"))
            throw new ConvexError({
                code: "BAD_REQUEST",
                message: "Request already pending",
            });

        for (const old of existingForTrip) {
            await ctx.db.delete(old._id);
        }

        const tripCount: number = await ctx.runQuery(
            components.betterAuth.methods.orgs.countUserMemberships,
            { userId: user._id }
        );

        const pendingRequests = await ctx.db
            .query("joinRequest")
            .withIndex("userId_tripId", (q) => q.eq("userId", user._id))
            .filter((q) => q.eq(q.field("status"), "pending"))
            .collect();

        if (pendingRequests.length >= LIMITS.MAX_REQUESTS_PER_USER) {
            throw new ConvexError({
                code: "FORBIDDEN",
                message: `You have too many pending requests. Cancel some before sending more.`,
            });
        }

        if (tripCount + pendingRequests.length >= LIMITS.MAX_TRIPS_PER_USER) {
            throw new ConvexError({
                code: "FORBIDDEN",
                message: `You can be part of at most ${LIMITS.MAX_TRIPS_PER_USER} trips. Your current trips plus pending requests have reached the limit.`,
            });
        }

        return ctx.db.insert("joinRequest", {
            tripId: trip._id,
            orgId: trip.orgId,
            userId: user._id,
            message,
            status: "pending",
            type: "user_request",
            tripTitle: trip.title,
            userName: user.name ?? "",
        });
    },
});

export const userListRequests = query({
    args: {
        search: v.optional(v.string()),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, { search, paginationOpts }) => {
        const user = await requireUserAccess(ctx);
        const searchTerm = search?.trim();

        if (searchTerm) {
            const results = await ctx.db
                .query("joinRequest")
                .withSearchIndex("search_by_trip", (qb) =>
                    qb
                        .search("tripTitle", searchTerm)
                        .eq("userId", user._id)
                        .eq("status", "pending")
                )
                .take(paginationOpts.numItems);

            const page = await Promise.all(
                results.map(async (req) => ({
                    ...req,
                    trip: await ctx.db.get(req.tripId),
                }))
            );

            return { page, isDone: true, continueCursor: "" };
        }

        const results = await ctx.db
            .query("joinRequest")
            .withIndex("userId_tripId", (qb) => qb.eq("userId", user._id))
            .filter((qb) => qb.eq(qb.field("status"), "pending"))
            .paginate(paginationOpts);

        const page = await Promise.all(
            results.page.map(async (req) => ({
                ...req,
                trip: await ctx.db.get(req.tripId),
            }))
        );

        return { ...results, page };
    },
});

export const userCancelRequest = mutation({
    args: { requestId: v.id("joinRequest") },
    handler: async (ctx, { requestId }) => {
        const user = await requireUserAccess(ctx);
        const req = await ctx.db.get(requestId);

        if (!req)
            throw new ConvexError({
                code: "NOT_FOUND",
                message: "Request not found",
            });
        if (req.userId !== user._id)
            throw new ConvexError({
                code: "FORBIDDEN",
                message: "Not your request",
            });
        if (req.type !== "user_request")
            throw new ConvexError({
                code: "BAD_REQUEST",
                message: "Not a user request",
            });
        if (req.status !== "pending")
            throw new ConvexError({
                code: "BAD_REQUEST",
                message: "Request already reviewed",
            });

        await ctx.db.delete(requestId);
    },
});

export const userReviewInvite = mutation({
    args: {
        requestId: v.id("joinRequest"),
        action: v.union(v.literal("accept"), v.literal("reject")),
    },
    handler: async (ctx, { requestId, action }) => {
        const user = await requireUserAccess(ctx);
        const req = await ctx.db.get(requestId);

        if (!req)
            throw new ConvexError({
                code: "NOT_FOUND",
                message: "Invite not found",
            });
        if (req.type !== "admin_invite")
            throw new ConvexError({
                code: "BAD_REQUEST",
                message: "Not an invite",
            });
        if (req.userId !== user._id)
            throw new ConvexError({
                code: "FORBIDDEN",
                message: "Not your invite",
            });
        if (req.status !== "pending")
            throw new ConvexError({
                code: "BAD_REQUEST",
                message: "Invite already reviewed",
            });

        await ctx.db.patch(requestId, {
            status: action === "accept" ? "accepted" : "rejected",
        });

        if (action === "accept") {
            const tripCount: number = await ctx.runQuery(
                components.betterAuth.methods.orgs.countUserMemberships,
                { userId: user._id }
            );
            if (tripCount >= LIMITS.MAX_TRIPS_PER_USER) {
                throw new ConvexError({
                    code: "FORBIDDEN",
                    message: `You can be part of at most ${LIMITS.MAX_TRIPS_PER_USER} trips.`,
                });
            }

            const now = Date.now();
            await ctx.runMutation(components.betterAuth.adapter.create, {
                input: {
                    model: "member",
                    data: {
                        organizationId: req.orgId,
                        userId: req.userId,
                        role: "member",
                        createdAt: now,
                    },
                },
            });

            await ctx.db.insert("tripMember", {
                tripId: req.tripId,
                userId: req.userId,
            });

            await notifyTrip(ctx, {
                tripId: req.tripId,
                excludeUserId: user._id,
                type: "member_joined",
                title: req.tripTitle,
                body: `${user.name ?? "Someone"} joined the trip`,
                url: `/trips/${req.tripId}/info`,
            });
        }
    },
});

export const adminSendInvite = mutation({
    args: {
        orgId: v.id("organization"),
        emails: v.array(v.string()),
        message: v.optional(v.string()),
    },
    handler: async (ctx, { orgId, emails, message }) => {
        const trip = await getTripFromOrgId(ctx, orgId);
        const { user: sender } = await requireTripPermission(
            ctx,
            trip._id,
            "member:invite"
        );

        const uniqueEmails = Array.from(
            new Set(emails.map((email) => email.trim().toLowerCase()))
        ).filter(Boolean);

        if (uniqueEmails.length === 0) {
            throw new ConvexError({
                code: "BAD_REQUEST",
                message: "No emails provided",
            });
        }

        const invited: Array<{
            userId: string;
            requestId: Doc<"joinRequest">["_id"];
            userName: string;
        }> = [];
        const skipped: Array<{ userId: string; reason: string }> = [];

        for (const email of uniqueEmails) {
            const targetUser: DocAuth<"user"> | null = await ctx.runQuery(
                components.betterAuth.adapter.findOne,
                {
                    model: "user",
                    where: [{ field: "email", value: email, operator: "eq" }],
                }
            );

            if (!targetUser) {
                skipped.push({
                    userId: email,
                    reason: `No user found for ${email}`,
                });
                continue;
            }

            const userId = targetUser._id;

            const existingMember = await findMember(ctx, userId, trip.orgId);
            if (existingMember) {
                skipped.push({
                    userId: email,
                    reason: `${targetUser.name ?? email} is already a member`,
                });
                continue;
            }

            const existingForTrip = await ctx.db
                .query("joinRequest")
                .withIndex("userId_tripId", (q) =>
                    q.eq("userId", userId).eq("tripId", trip._id)
                )
                .collect();

            if (existingForTrip.some((r) => r.status === "pending")) {
                skipped.push({
                    userId: email,
                    reason: `${targetUser.name ?? email} already has a pending invite`,
                });
                continue;
            }

            for (const old of existingForTrip) {
                await ctx.db.delete(old._id);
            }

            const targetTripCount: number = await ctx.runQuery(
                components.betterAuth.methods.orgs.countUserMemberships,
                { userId }
            );

            const targetPending = await ctx.db
                .query("joinRequest")
                .withIndex("userId_tripId", (q) => q.eq("userId", userId))
                .filter((q) => q.eq(q.field("status"), "pending"))
                .collect();

            if (
                targetTripCount + targetPending.length >=
                LIMITS.MAX_TRIPS_PER_USER
            ) {
                skipped.push({
                    userId: email,
                    reason: "This user has reached the maximum number of trips.",
                });
                continue;
            }

            const requestId = await ctx.db.insert("joinRequest", {
                tripId: trip._id,
                orgId: trip.orgId,
                userId,
                message,
                status: "pending",
                type: "admin_invite",
                tripTitle: trip.title,
                userName: targetUser?.name ?? "",
            });

            invited.push({
                userId,
                requestId,
                userName: targetUser?.name ?? "a user",
            });

            await notifyUser(ctx, {
                userId,
                type: "join_request",
                tripId: trip._id,
                referenceId: requestId,
                title: "Trip Invite",
                body: `${sender.name ?? "Someone"} invited you to ${trip.title}`,
                url: `/trips`,
            });
        }

        if (invited.length > 0) {
            const names = invited.map((i) => i.userName);
            const content =
                names.length === 1
                    ? `invited ${names[0]}`
                    : `invited ${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

            await ctx.db.insert("message", {
                tripId: trip._id,
                senderId: sender._id,
                type: "member_invited",
                content,
            });
        }

        return {
            invited,
            skipped,
            totalRequested: uniqueEmails.length,
        };
    },
});

export const adminListRequests = query({
    args: {
        orgId: v.string(),
        search: v.optional(v.string()),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, { orgId, search, paginationOpts }) => {
        const trip = await getTripFromOrgId(ctx, orgId as Id<"organization">);
        await requireTripPermission(ctx, trip._id, "member:invite");
        const searchTerm = search?.trim();

        const enrichUser = async (req: Doc<"joinRequest">) => {
            const user: DocAuth<"user"> | null = await ctx.runQuery(
                components.betterAuth.adapter.findOne,
                {
                    model: "user",
                    where: [
                        { field: "_id", value: req.userId, operator: "eq" },
                    ],
                }
            );
            return { ...req, user };
        };

        if (searchTerm) {
            const results = await ctx.db
                .query("joinRequest")
                .withSearchIndex("search_by_user", (qb) =>
                    qb
                        .search("userName", searchTerm)
                        .eq("tripId", trip._id)
                        .eq("status", "pending")
                        .eq("type", "user_request")
                )
                .take(paginationOpts.numItems);

            const enriched = await Promise.all(results.map(enrichUser));
            return { page: enriched, isDone: true, continueCursor: "" };
        }

        const results = await ctx.db
            .query("joinRequest")
            .withIndex("tripId_status", (qb) =>
                qb.eq("tripId", trip._id).eq("status", "pending")
            )
            .filter((qb) => qb.eq(qb.field("type"), "user_request"))
            .paginate(paginationOpts);

        const enriched = await Promise.all(results.page.map(enrichUser));
        return { ...results, page: enriched };
    },
});

export const adminCancelInvite = mutation({
    args: { requestId: v.id("joinRequest") },
    handler: async (ctx, { requestId }) => {
        const req = await ctx.db.get(requestId);

        if (!req)
            throw new ConvexError({
                code: "NOT_FOUND",
                message: "Invite not found",
            });
        if (req.type !== "admin_invite")
            throw new ConvexError({
                code: "BAD_REQUEST",
                message: "Not an invite",
            });
        if (req.status !== "pending")
            throw new ConvexError({
                code: "BAD_REQUEST",
                message: "Invite already reviewed",
            });

        await requireTripPermission(ctx, req.tripId, "member:invite");
        await ctx.db.delete(requestId);
    },
});

export const adminReviewRequest = mutation({
    args: {
        requestId: v.id("joinRequest"),
        action: v.union(v.literal("accept"), v.literal("reject")),
    },
    handler: async (ctx, { requestId, action }) => {
        const req = await ctx.db.get(requestId);

        if (!req)
            throw new ConvexError({
                code: "NOT_FOUND",
                message: "Request not found",
            });
        if (req.type !== "user_request")
            throw new ConvexError({
                code: "BAD_REQUEST",
                message: "Not a user request",
            });
        if (req.status !== "pending")
            throw new ConvexError({
                code: "BAD_REQUEST",
                message: "Request already reviewed",
            });

        await requireTripPermission(ctx, req.tripId, "member:add");

        await ctx.db.patch(requestId, {
            status: action === "accept" ? "accepted" : "rejected",
        });

        if (action === "accept") {
            const tripCount: number = await ctx.runQuery(
                components.betterAuth.methods.orgs.countUserMemberships,
                { userId: req.userId }
            );
            if (tripCount >= LIMITS.MAX_TRIPS_PER_USER) {
                throw new ConvexError({
                    code: "FORBIDDEN",
                    message:
                        "This user has reached the maximum number of trips.",
                });
            }

            const now = Date.now();
            await ctx.runMutation(components.betterAuth.adapter.create, {
                input: {
                    model: "member",
                    data: {
                        organizationId: req.orgId,
                        userId: req.userId,
                        role: "member",
                        createdAt: now,
                    },
                },
            });

            await ctx.db.insert("tripMember", {
                tripId: req.tripId,
                userId: req.userId,
            });

            await notifyUser(ctx, {
                userId: req.userId,
                type: "join_request",
                tripId: req.tripId,
                title: "Request Accepted",
                body: `Your request to join ${req.tripTitle} was accepted`,
                url: `/trips/${req.tripId}/chat`,
            });
        }
    },
});

export const checkRequestStatus = query({
    args: { tripId: v.id("trip") },
    handler: async (ctx, { tripId }) => {
        const user = await requireUserAccess(ctx);

        const request = await ctx.db
            .query("joinRequest")
            .withIndex("userId_tripId", (q) =>
                q.eq("userId", user._id).eq("tripId", tripId)
            )
            .order("desc")
            .first();

        if (!request) return { status: "none" as const };
        return { status: request.status };
    },
});
