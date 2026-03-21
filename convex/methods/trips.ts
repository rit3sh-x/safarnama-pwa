import { components, internal } from "@backend/api"
import { ConvexError, v } from "convex/values"
import { nanoid } from "nanoid"
import { mutation, query } from "../_generated/server"
import {
  requireTripAdmin,
  requireTripMember,
  requireUserAccess,
} from "../lib/utils"
import { LIMITS } from "../lib/constants"
import { paginationOptsValidator, type PaginationResult } from "convex/server"
import type { Doc, Id } from "../betterAuth/_generated/dataModel"
import type { Org } from "../betterAuth/methods/types"

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
    const user = await requireUserAccess(ctx)

    const tripCount: number = await ctx.runQuery(
      components.betterAuth.methods.orgs.countUserMemberships,
      { userId: user._id }
    )
    if (tripCount >= LIMITS.MAX_TRIPS_PER_USER) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: `You can be part of at most ${LIMITS.MAX_TRIPS_PER_USER} trips. Leave or delete a trip first.`,
      })
    }

    const now = Date.now()

    const baseSlug = title
      .toLowerCase()
      .replace(/[^\w ]+/g, "")
      .replace(/ +/g, "-")

    const slug = `${baseSlug}-${nanoid(10)}`

    const org = await ctx.runMutation(components.betterAuth.adapter.create, {
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
    })

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
    })

    const tripId = await ctx.db.insert("trip", {
      orgId: org._id,
      title,
      ...fields,
      createdBy: user._id,
      updatedAt: now,
    })

    await ctx.db.insert("tripMember", {
      tripId,
      userId: user._id,
    })

    return { tripId, orgId: org._id }
  },
})

export const get = query({
  args: {
    tripId: v.id("trip"),
  },
  handler: async (ctx, { tripId }) => {
    const trip = await ctx.db.get(tripId)
    if (trip?.isPublic) return trip

    await requireTripMember(ctx, tripId)
    return trip
  },
})

export const list = query({
  args: {
    search: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { search, paginationOpts }) => {
    const user = await requireUserAccess(ctx)

    const memberships: Doc<"member">[] = await ctx.runQuery(
      components.betterAuth.methods.orgs.listUserMemberships,
      { userId: user._id }
    )

    const orgIds = memberships.map((m) => m.organizationId)
    const roleMap = new Map(memberships.map((m) => [m.organizationId, m.role]))

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
    )

    const tripData = await Promise.all(
      orgs.page.map(async (o) => {
        const trip = await ctx.db
          .query("trip")
          .withIndex("orgId", (q) => q.eq("orgId", o._id))
          .unique()

        if (!trip) return null

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
        ])

        let unreadCount = 0
        if (lastMsg) {
          const sinceTime = cursor?.lastReadTime ?? 0
          const unread = await ctx.db
            .query("message")
            .withIndex("tripId", (q) => q.eq("tripId", trip._id))
            .filter((q) => q.gt(q.field("_creationTime"), sinceTime))
            .take(100)
          unreadCount = unread.length
        }

        return {
          org: o,
          trip,
          lastMsg,
          unreadCount,
          role: roleMap.get(o._id) ?? "member",
        }
      })
    )

    const validData = tripData.filter(
      (d): d is NonNullable<typeof d> => d !== null
    )

    return {
      ...orgs,
      page: validData.map(({ org, trip, lastMsg, unreadCount, role }) => ({
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
      })),
    }
  },
})

export const listPublic = query({
  args: {
    search: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { search, paginationOpts }) => {
    const s = search?.trim().toLowerCase()

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
      .paginate(paginationOpts)

    const orgIds = trips.page.map((t) => t.orgId)

    const orgs: Org[] = await ctx.runQuery(
      components.betterAuth.methods.orgs.getOrgsByIds,
      { orgIds }
    )

    const orgMap = new Map(orgs.map((o) => [o.id, o]))

    return {
      ...trips,
      page: trips.page.map((t) => {
        const org = orgMap.get(t.orgId as Id<"organization">)
        return {
          tripId: t._id,
          name: t.title,
          logo: org?.logo,
          updatedAt: t.updatedAt,
          destination: t.destination,
          description: t.description,
        }
      }),
    }
  },
})

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
    const { trip } = await requireTripAdmin(ctx, tripId)

    if (title && title !== trip.title) {
      await ctx.runMutation(components.betterAuth.adapter.updateOne, {
        input: {
          model: "organization",
          where: [{ field: "_id", value: trip.orgId, operator: "eq" }],
          update: { name: title },
        },
      })
    }

    await ctx.db.patch(tripId, {
      ...(title !== undefined && { title }),
      ...fields,
      updatedAt: Date.now(),
    })
  },
})

export const remove = mutation({
  args: { tripId: v.id("trip") },
  handler: async (ctx, { tripId }) => {
    const { trip } = await requireTripAdmin(ctx, tripId)

    const deleteByTripIndex = async (
      table:
        | "message"
        | "expense"
        | "expenseSplit"
        | "settlement"
        | "joinRequest"
        | "blog"
        | "blogComment"
        | "messageReadCursor"
    ) => {
      const docs = await ctx.db
        .query(table)
        .withIndex("tripId", (q) => q.eq("tripId", tripId))
        .collect()
      await Promise.all(docs.map((doc) => ctx.db.delete(doc._id)))
    }

    await Promise.all([
      deleteByTripIndex("message"),
      deleteByTripIndex("expense"),
      deleteByTripIndex("expenseSplit"),
      deleteByTripIndex("settlement"),
      deleteByTripIndex("joinRequest"),
      deleteByTripIndex("blog"),
      deleteByTripIndex("blogComment"),
      deleteByTripIndex("messageReadCursor"),
    ])

    const tripMembers = await ctx.db
      .query("tripMember")
      .filter((q) => q.eq(q.field("tripId"), tripId))
      .collect()
    await Promise.all(tripMembers.map((doc) => ctx.db.delete(doc._id)))

    await ctx.runMutation(
      components.betterAuth.methods.orgs.deleteOrgAndRelated,
      { organizationId: trip.orgId }
    )

    await ctx.db.delete(tripId)
  },
})

export const generateItinerary = mutation({
  args: {
    tripId: v.id("trip"),
    userPrompt: v.optional(v.string()),
  },
  handler: async (ctx, { tripId, userPrompt }) => {
    const { trip } = await requireTripMember(ctx, tripId)

    if (!trip.startDate || !trip.endDate) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Trip must have start and end dates to generate an itinerary.",
      })
    }

    await ctx.scheduler.runAfter(0, internal.methods.ai.planTrip, {
      tripId,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      userPrompt,
    })
  },
})

export const getItinerary = query({
  args: { tripId: v.id("trip") },
  handler: async (ctx, { tripId }) => {
    return await ctx.db
      .query("itinerary")
      .withIndex("by_trip", (q) => q.eq("tripId", tripId))
      .order("asc")
      .collect()
  },
})
