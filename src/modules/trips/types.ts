import { api } from "@backend/api"
import type { Id } from "@backend/dataModel"
import type { Doc, Id as IdAuth } from "@backend/authDataModel"
import type { FunctionReturnType, FunctionArgs } from "convex/server"

export interface SelectedTrip {
  tripId: Id<"trip">
  orgId: IdAuth<"organization">
  name: string
  logo?: string
  role: Doc<"member">["role"]
}

export type NavOption = "trips" | "invites" | "public_trips"

export type TripPanelView = "chat" | "info" | "expenses" | "plan"

export type TripId = Id<"trip">

type TripsPlanResult = FunctionReturnType<typeof api.methods.trips.getItinerary>
export type DayItem = TripsPlanResult[number]["items"][number]

type TripsListResult = FunctionReturnType<typeof api.methods.trips.list>
export type TripOrg = TripsListResult["page"][number]

type PublicTripsResult = FunctionReturnType<typeof api.methods.trips.listPublic>
export type PublicTrip = PublicTripsResult["page"][number]

type InvitesListResult = FunctionReturnType<
  typeof api.methods.requests.userListRequests
>
export type InviteItem = InvitesListResult["page"][number]

export type ReviewType = FunctionArgs<
  typeof api.methods.requests.userReviewInvite
>["action"]

type MessagesListResult = FunctionReturnType<typeof api.methods.messages.list>
export type Message = MessagesListResult["page"][number]
