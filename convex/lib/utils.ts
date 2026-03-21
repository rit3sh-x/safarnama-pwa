import { APIError } from "better-auth/api"
import { ConvexError } from "convex/values"
import type { GenericCtx } from "@convex-dev/better-auth"
import type { DataModel, Id } from "../_generated/dataModel"
import { components } from "../_generated/api"
import type { Doc, Id as IdAuth } from "../betterAuth/_generated/dataModel"
import type { QueryCtx, MutationCtx } from "../_generated/server"
import type { Category, CoercedItem, RawItem } from "./types"
import { VALID_CATEGORIES } from "./constants"

export async function requireUserAccess(ctx: GenericCtx<DataModel>) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity)
    throw new APIError("UNAUTHORIZED", {
      message: "Please sign in to continue.",
    })

  const user: Doc<"user"> = await ctx.runQuery(
    components.betterAuth.adapter.findOne,
    {
      model: "user",
      where: [{ field: "_id", value: identity.subject, operator: "eq" }],
    }
  )

  return user
}

export async function requireOrgAccess(
  ctx: GenericCtx<DataModel>,
  orgId: string
) {
  const user = await requireUserAccess(ctx)

  const member: Doc<"member"> | null = await ctx.runQuery(
    components.betterAuth.adapter.findOne,
    {
      model: "member",
      where: [
        { field: "userId", value: user._id, operator: "eq" },
        { field: "organizationId", value: orgId, operator: "eq" },
      ],
    }
  )

  if (!member)
    throw new APIError("FORBIDDEN", {
      message: "You do not have access to this organization.",
    })

  return { user, member }
}

export async function getTripFromTripId(
  ctx: QueryCtx | MutationCtx,
  tripId: Id<"trip">
) {
  const trip = await ctx.db.get(tripId)
  if (!trip)
    throw new ConvexError({ code: "NOT_FOUND", message: "Trip not found" })
  return trip
}

export async function getTripFromOrgId(
  ctx: QueryCtx | MutationCtx,
  orgId: IdAuth<"organization">
) {
  const trip = await ctx.db
    .query("trip")
    .withIndex("orgId", (q) => q.eq("orgId", orgId))
    .unique()
  if (!trip)
    throw new ConvexError({ code: "NOT_FOUND", message: "Trip not found" })
  return trip
}

export async function requireTripMember(
  ctx: QueryCtx | MutationCtx,
  tripId: Id<"trip">
) {
  const trip = await ctx.db.get(tripId)
  if (!trip)
    throw new ConvexError({ code: "NOT_FOUND", message: "Trip not found" })

  const user = await requireUserAccess(ctx)

  const member: Doc<"member"> | null = await ctx.runQuery(
    components.betterAuth.adapter.findOne,
    {
      model: "member",
      where: [
        { field: "userId", value: user._id, operator: "eq" },
        { field: "organizationId", value: trip.orgId, operator: "eq" },
      ],
    }
  )

  if (!member)
    throw new APIError("FORBIDDEN", {
      message: "Not a member of this trip.",
    })

  return { user, member, trip }
}

export async function requireTripAdmin(
  ctx: QueryCtx | MutationCtx,
  tripId: Id<"trip">
) {
  const result = await requireTripMember(ctx, tripId)
  if (result.member.role !== "owner")
    throw new APIError("FORBIDDEN", { message: "Admin access required." })
  return result
}

type Permission = "member:invite" | "member:add" | "member:remove"

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  owner: ["member:invite", "member:add", "member:remove"],
  member: ["member:invite", "member:add"],
}

export function hasPermission(role: string, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export async function requireTripPermission(
  ctx: QueryCtx | MutationCtx,
  tripId: Id<"trip">,
  permission: Permission
) {
  const result = await requireTripMember(ctx, tripId)
  if (!hasPermission(result.member.role, permission)) {
    throw new APIError("FORBIDDEN", {
      message: `Missing permission: ${permission}`,
    })
  }
  return result
}

export function coerceItem(raw: RawItem): CoercedItem {
  const category: Category = VALID_CATEGORIES.includes(raw.category as Category)
    ? (raw.category as Category)
    : "other"

  return {
    time: String(raw.time ?? "09:00"),
    duration: String(raw.duration ?? "1 hour"),
    category,
    title: String(raw.title ?? ""),
    description: String(raw.description ?? ""),
    location: String(raw.location ?? ""),
    pricing: {
      amount: Number(raw.pricing?.amount ?? 0),
      currency: String(raw.pricing?.currency ?? "INR"),
      note: String(raw.pricing?.note ?? ""),
    },
    weather: String(raw.weather ?? ""),
    tips: Array.isArray(raw.tips) ? raw.tips.map(String) : [],
    imageUrl: String(raw.imageUrl ?? ""),
    imageSource: raw.imageSource ? String(raw.imageSource) : undefined,
    rating: raw.rating != null ? Number(raw.rating) : undefined,
    bookingUrl: raw.bookingUrl ? String(raw.bookingUrl) : undefined,
  }
}

export function extractJson(text: string): string {
  const stripped = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim()

  const match = stripped.match(/\{[\s\S]*\}/)
  if (match) return match[0]
  return stripped
}
