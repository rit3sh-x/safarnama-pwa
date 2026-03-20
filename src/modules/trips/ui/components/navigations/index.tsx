import { useNavigationOptions } from "@/modules/trips/hooks/use-navigation-options"
import { useTrips, usePublicTrips } from "@/modules/trips/hooks/use-trips"
import {
  useListRequests,
  useReviewInvite,
} from "@/modules/trips/hooks/use-invites"
import { TripsList } from "./trips-list"
import { InvitesList } from "./invites-list"
import { PublicTripsList } from "./public-trips-list"
import { useNavigate } from "@tanstack/react-router"
import { useCallback } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { useSetAtom } from "jotai"
import { selectedTripAtom } from "../../../atoms"
import type { InviteItem, ReviewType } from "../../../types"
import type { Id } from "@backend/dataModel"
import type { Doc, Id as IdAuth } from "@backend/authDataModel"

function TripsTab() {
  const { trips, isLoading, isDone, loadMore } = useTrips()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const setSelectedTrip = useSetAtom(selectedTripAtom)

  const handlePress = useCallback(
    ({
      tripId,
      orgId,
      name,
      logo,
      role,
    }: {
      tripId: Id<"trip">
      orgId: IdAuth<"organization">
      name: string
      logo?: string
      role: Doc<"member">["role"]
    }) => {
      setSelectedTrip({ tripId, orgId, name, logo, role })
      if (isMobile) {
        navigate({
          to: "/trips/$tripId/chat",
          params: { tripId },
        })
      }
    },
    [navigate, isMobile, setSelectedTrip]
  )

  return (
    <TripsList
      trips={trips}
      isLoading={isLoading}
      isDone={isDone}
      loadMore={loadMore}
      onPress={handlePress}
    />
  )
}

function InvitesTab() {
  const { invites, isLoading, isDone, loadMore } = useListRequests()
  const { mutate: reviewInvite, isPending } = useReviewInvite()

  const handleReview = useCallback(
    (requestId: InviteItem["_id"], action: ReviewType) => {
      reviewInvite({ requestId, action })
    },
    [reviewInvite]
  )

  return (
    <InvitesList
      invites={invites}
      isLoading={isLoading}
      isDone={isDone}
      loadMore={loadMore}
      onReview={handleReview}
      isReviewing={isPending}
    />
  )
}

function PublicTripsTab() {
  const { trips, isLoading, isDone, loadMore } = usePublicTrips()
  const navigate = useNavigate()

  const handlePress = useCallback(
    (tripId: Id<"trip">) => {
      navigate({
        to: "/trips/$tripId/info",
        params: { tripId },
      })
    },
    [navigate]
  )

  return (
    <PublicTripsList
      trips={trips}
      isLoading={isLoading}
      isDone={isDone}
      loadMore={loadMore}
      onPress={handlePress}
    />
  )
}

export const Navigations = () => {
  const { tab } = useNavigationOptions()

  return (
    <div className="flex-1">
      {tab === "trips" && <TripsTab />}
      {tab === "invites" && <InvitesTab />}
      {tab === "public_trips" && <PublicTripsTab />}
    </div>
  )
}
