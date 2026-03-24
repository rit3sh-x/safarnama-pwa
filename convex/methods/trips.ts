import { components, internal } from "@backend/api";
import { ConvexError, v } from "convex/values";
import { nanoid } from "nanoid";
import { mutation, query } from "../_generated/server";
import {
    requireTripAdmin,
    requireTripMember,
    requireUserAccess,
} from "../lib/utils";
import { LIMITS } from "../lib/constants";
import { paginationOptsValidator, type PaginationResult } from "convex/server";
import type { Doc, Id } from "../betterAuth/_generated/dataModel";
import type { Org } from "../betterAuth/methods/types";

export const create = mutation({
    args: {
        title: v.string(),
        destination: v.string(),
        logoUrl: v.optional(v.string()),
        isPublic: v.boolean(),
        description: v.optional(v.string()),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
    },
    handler: async (ctx, { title, logoUrl, ...fields }) => {
        const user = await requireUserAccess(ctx);

        const tripCount: number = await ctx.runQuery(
            components.betterAuth.methods.orgs.countUserMemberships,
            { userId: user._id }
        );
        if (tripCount >= LIMITS.MAX_TRIPS_PER_USER) {
            throw new ConvexError({
                code: "FORBIDDEN",
                message: `You can be part of at most ${LIMITS.MAX_TRIPS_PER_USER} trips. Leave or delete a trip first.`,
            });
        }

        const now = Date.now();

        const baseSlug = title
            .toLowerCase()
            .replace(/[^\w ]+/g, "")
            .replace(/ +/g, "-");

        const slug = `${baseSlug}-${nanoid(10)}`;

        const org: Doc<"organization"> = await ctx.runMutation(
            components.betterAuth.adapter.create,
            {
                input: {
                    model: "organization",
                    data: {
                        name: title.toLocaleLowerCase(),
                        slug,
                        logo: logoUrl,
                        createdAt: now,
                        updatedAt: now,
                        metadata: null,
                    },
                },
            }
        );

        await ctx.runMutation(components.betterAuth.adapter.create, {
            input: {
                model: "member",
                data: {
                    organizationId: org._id,
                    userId: user._id,
                    role: "owner",
                    createdAt: now,
                },
            },
        });

        const tripId = await ctx.db.insert("trip", {
            orgId: org._id,
            title,
            ...fields,
            createdBy: user._id,
            updatedAt: now,
        });

        await ctx.db.insert("tripMember", {
            tripId,
            userId: user._id,
        });

        return { tripId, orgId: org._id };
    },
});

export const get = query({
    args: {
        tripId: v.id("trip"),
    },
    handler: async (ctx, { tripId }) => {
        const trip = await ctx.db.get(tripId);

        if (!trip) return null;

        const org: Doc<"organization"> = await ctx.runQuery(
            components.betterAuth.adapter.findOne,
            {
                model: "organization",
                where: [
                    {
                        field: "_id",
                        value: trip.orgId,
                        operator: "eq",
                    },
                ],
            }
        );

        const tripData = {
            startDate: trip.startDate,
            endDate: trip.endDate,
            destination: trip.destination,
            description: trip.description,
            isPublic: trip.isPublic,
            orgId: trip.orgId as Id<"organization">,
            logo: org.logo,
            itineraryStatus: trip.itineraryStatus,
            title: trip.title,
        };

        if (trip.isPublic) return tripData;

        await requireTripMember(ctx, tripId);
        return tripData;
    },
});

export const list = query({
    args: {
        search: v.optional(v.string()),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, { search, paginationOpts }) => {
        const user = await requireUserAccess(ctx);

        const memberships: Doc<"member">[] = await ctx.runQuery(
            components.betterAuth.methods.orgs.listUserMemberships,
            { userId: user._id }
        );

        const orgIds = memberships.map((m) => m.organizationId);
        const roleMap = new Map(
            memberships.map((m) => [m.organizationId, m.role])
        );

        const orgs: PaginationResult<Doc<"organization">> = await ctx.runQuery(
            components.betterAuth.adapter.findMany,
            {
                model: "organization",
                where: [
                    {
                        field: "_id",
                        value: orgIds,
                        operator: "in" as const,
                        connector: "AND" as const,
                    },
                    ...(search
                        ? [
                              {
                                  field: "name",
                                  value: search.toLowerCase(),
                                  operator: "contains" as const,
                              },
                          ]
                        : []),
                ],
                paginationOpts,
            }
        );

        const tripData = await Promise.all(
            orgs.page.map(async (o) => {
                const trip = await ctx.db
                    .query("trip")
                    .withIndex("orgId", (q) => q.eq("orgId", o._id))
                    .unique();

                if (!trip) return null;

                const [lastMsg, cursor] = await Promise.all([
                    ctx.db
                        .query("message")
                        .withIndex("tripId", (q) => q.eq("tripId", trip._id))
                        .order("desc")
                        .first(),
                    ctx.db
                        .query("messageReadCursor")
                        .withIndex("tripId_userId", (q) =>
                            q.eq("tripId", trip._id).eq("userId", user._id)
                        )
                        .unique(),
                ]);

                let unreadCount = 0;
                if (lastMsg) {
                    const sinceTime = cursor?.lastReadTime ?? 0;
                    const unread = await ctx.db
                        .query("message")
                        .withIndex("tripId", (q) => q.eq("tripId", trip._id))
                        .filter((q) =>
                            q.gt(q.field("_creationTime"), sinceTime)
                        )
                        .take(100);
                    unreadCount = unread.length;
                }

                return {
                    org: o,
                    trip,
                    lastMsg,
                    unreadCount,
                    role: roleMap.get(o._id) ?? "member",
                };
            })
        );

        const validData = tripData.filter(
            (d): d is NonNullable<typeof d> => d !== null
        );

        return {
            ...orgs,
            page: validData.map(
                ({ org, trip, lastMsg, unreadCount, role }) => ({
                    orgId: org._id,
                    tripId: trip._id,
                    name: trip.title,
                    logo: org.logo,
                    updatedAt: lastMsg ? lastMsg._creationTime : trip.updatedAt,
                    lastMessage: lastMsg
                        ? {
                              content: lastMsg.content,
                              senderId: lastMsg.senderId,
                              deletedAt: lastMsg.deletedAt,
                          }
                        : null,
                    unreadCount,
                    destination: trip.destination,
                    role,
                })
            ),
        };
    },
});

export const listPublic = query({
    args: {
        search: v.optional(v.string()),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, { search, paginationOpts }) => {
        const s = search?.trim().toLowerCase();

        const trips = await ctx.db
            .query("trip")
            .withIndex("isPublic", (q) => q.eq("isPublic", true))
            .filter((q2) =>
                s
                    ? q2.or(
                          q2.gte(q2.field("title"), s),
                          q2.gte(q2.field("destination"), s)
                      )
                    : q2.eq(q2.field("isPublic"), true)
            )
            .order("desc")
            .paginate(paginationOpts);

        const orgIds = trips.page.map((t) => t.orgId);

        const orgs: Org[] = await ctx.runQuery(
            components.betterAuth.methods.orgs.getOrgsByIds,
            { orgIds }
        );

        const orgMap = new Map(orgs.map((o) => [o.id, o]));

        return {
            ...trips,
            page: trips.page.map((t) => {
                const org = orgMap.get(t.orgId as Id<"organization">);
                return {
                    tripId: t._id,
                    name: t.title,
                    logo: org?.logo,
                    updatedAt: t.updatedAt,
                    destination: t.destination,
                    description: t.description,
                };
            }),
        };
    },
});

export const update = mutation({
    args: {
        tripId: v.id("trip"),
        title: v.optional(v.string()),
        destination: v.optional(v.string()),
        description: v.optional(v.string()),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
        isPublic: v.optional(v.boolean()),
    },
    handler: async (ctx, { tripId, title, ...fields }) => {
        const { trip } = await requireTripAdmin(ctx, tripId);

        if (title && title !== trip.title) {
            await ctx.runMutation(components.betterAuth.adapter.updateOne, {
                input: {
                    model: "organization",
                    where: [
                        { field: "_id", value: trip.orgId, operator: "eq" },
                    ],
                    update: { name: title },
                },
            });
        }

        await ctx.db.patch(tripId, {
            ...(title !== undefined && { title }),
            ...fields,
            updatedAt: Date.now(),
        });
    },
});

export const remove = mutation({
    args: { tripId: v.id("trip") },
    handler: async (ctx, { tripId }) => {
        const { trip } = await requireTripAdmin(ctx, tripId);

        const deleteByTripIndex = async (
            table:
                | "message"
                | "expense"
                | "expenseSplit"
                | "settlement"
                | "joinRequest"
                | "blog"
                | "messageReadCursor"
        ) => {
            const docs = await ctx.db
                .query(table)
                .withIndex("tripId", (q) => q.eq("tripId", tripId))
                .collect();
            await Promise.all(docs.map((doc) => ctx.db.delete(doc._id)));
        };

        const blog = await ctx.db
            .query("blog")
            .withIndex("tripId", (q) => q.eq("tripId", tripId))
            .unique();
        if (blog) {
            const comments = await ctx.db
                .query("blogComment")
                .withIndex("blogId", (q) => q.eq("blogId", blog._id))
                .collect();
            await Promise.all(comments.map((c) => ctx.db.delete(c._id)));
        }

        await Promise.all([
            deleteByTripIndex("message"),
            deleteByTripIndex("expense"),
            deleteByTripIndex("expenseSplit"),
            deleteByTripIndex("settlement"),
            deleteByTripIndex("joinRequest"),
            deleteByTripIndex("blog"),
            deleteByTripIndex("messageReadCursor"),
        ]);

        const tripMembers = await ctx.db
            .query("tripMember")
            .filter((q) => q.eq(q.field("tripId"), tripId))
            .collect();
        await Promise.all(tripMembers.map((doc) => ctx.db.delete(doc._id)));

        await ctx.runMutation(
            components.betterAuth.methods.orgs.deleteOrgAndRelated,
            { organizationId: trip.orgId }
        );

        await ctx.db.delete(tripId);
    },
});

export const generateItinerary = mutation({
    args: {
        tripId: v.id("trip"),
        userPrompt: v.optional(v.string()),
    },
    handler: async (ctx, { tripId, userPrompt }) => {
        const { trip } = await requireTripMember(ctx, tripId);

        if (!trip.startDate || !trip.endDate) {
            throw new ConvexError({
                code: "BAD_REQUEST",
                message:
                    "Trip must have start and end dates to generate an itinerary.",
            });
        }

        await ctx.db.patch(tripId, { itineraryStatus: "planning" });

        await ctx.scheduler.runAfter(0, internal.methods.ai.planTrip, {
            tripId,
            destination: trip.destination,
            startDate: trip.startDate,
            endDate: trip.endDate,
            userPrompt,
        });
    },
});

export const dashboardSummary = query({
    args: {},
    handler: async (ctx) => {
        const user = await requireUserAccess(ctx);

        const memberships: Doc<"member">[] = await ctx.runQuery(
            components.betterAuth.methods.orgs.listUserMemberships,
            { userId: user._id }
        );

        const orgIds = memberships.map((m) => m.organizationId);

        const trips = (
            await Promise.all(
                orgIds.map((orgId) =>
                    ctx.db
                        .query("trip")
                        .withIndex("orgId", (q) => q.eq("orgId", orgId))
                        .unique()
                )
            )
        ).filter((t): t is NonNullable<typeof t> => t !== null);

        const orgs: PaginationResult<Doc<"organization">> = await ctx.runQuery(
            components.betterAuth.adapter.findMany,
            {
                model: "organization",
                where: [
                    {
                        field: "_id",
                        value: orgIds,
                        operator: "in" as const,
                        connector: "AND" as const,
                    },
                ],
                paginationOpts: { numItems: orgIds.length, cursor: null },
            }
        );
        const orgMap = new Map(orgs.page.map((o) => [o._id, o]));

        const now = Date.now();

        const upcomingTrips = trips
            .filter((t) => t.startDate && t.startDate > now)
            .sort((a, b) => (a.startDate ?? 0) - (b.startDate ?? 0))
            .slice(0, 5)
            .map((t) => ({
                tripId: t._id,
                title: t.title,
                destination: t.destination,
                startDate: t.startDate!,
                logo: orgMap.get(t.orgId as Id<"organization">)?.logo,
            }));

        const recentTrips = trips
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .slice(0, 3)
            .map((t) => ({
                tripId: t._id,
                title: t.title,
                destination: t.destination,
                updatedAt: t.updatedAt,
                logo: orgMap.get(t.orgId as Id<"organization">)?.logo,
            }));

        const recentMessages = (
            await Promise.all(
                trips.slice(0, 10).map(async (trip) => {
                    const msg = await ctx.db
                        .query("message")
                        .withIndex("tripId", (q) => q.eq("tripId", trip._id))
                        .order("desc")
                        .first();
                    return msg ? { ...msg, tripTitle: trip.title } : null;
                })
            )
        )
            .filter((m): m is NonNullable<typeof m> => m !== null)
            .sort((a, b) => b._creationTime - a._creationTime)
            .slice(0, 5);

        const senderIds = [...new Set(recentMessages.map((m) => m.senderId))];
        const users: {
            userId: string;
            username: string;
            image: string | null;
        }[] =
            senderIds.length > 0
                ? await ctx.runQuery(
                      components.betterAuth.methods.users.getUsersByIds,
                      { userIds: senderIds as Id<"user">[] }
                  )
                : [];
        const userMap = new Map(users.map((u) => [u.userId, u]));

        const messagesWithSender = recentMessages.map((m) => ({
            tripId: m.tripId,
            tripTitle: m.tripTitle,
            content: m.content,
            senderId: m.senderId,
            senderName: userMap.get(m.senderId)?.username ?? "Unknown",
            createdAt: m._creationTime,
            type: m.type,
        }));

        const blogs = await ctx.db
            .query("blog")
            .filter((q) => q.eq(q.field("status"), "published"))
            .collect();
        const userBlogCount = blogs.filter((b) =>
            trips.some((t) => t._id === b.tripId)
        ).length;

        return {
            totalTrips: trips.length,
            upcomingTrips,
            recentTrips,
            recentMessages: messagesWithSender,
            totalBlogs: userBlogCount,
        };
    },
});

export const getItinerary = query({
    args: { tripId: v.id("trip") },
    handler: async (ctx, { tripId }) => {
        return await ctx.db
            .query("itinerary")
            .withIndex("by_trip", (q) => q.eq("tripId", tripId))
            .order("asc")
            .collect();
    },
});
