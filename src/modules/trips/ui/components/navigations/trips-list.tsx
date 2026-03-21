import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { InfiniteScrollTrigger } from "@/components/infinite-scroll-trigger"
import { cn, getInitials, stringToHex } from "@/lib/utils"
import type { Id } from "@backend/dataModel"
import { formatDistanceToNow } from "date-fns"
import type { TripOrg } from "../../../types"
import { useAtomValue } from "jotai"
import { selectedTripAtom } from "@/modules/trips/atoms"
import { useAuthenticatedUser } from "@/modules/auth/hooks/use-authentication"
import type { Doc, Id as IdAuth } from "@backend/authDataModel"

export function TripListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Skeleton className="h-14 w-14 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32 rounded-md" />
          <Skeleton className="h-3 w-10 rounded-md" />
        </div>
        <Skeleton className="h-3 w-24 rounded-md" />
        <Skeleton className="h-3 w-40 rounded-md" />
      </div>
    </div>
  )
}

function TripListSkeletons() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <TripListItemSkeleton key={i} />
      ))}
    </>
  )
}

interface TripListItemProps {
  trip: TripOrg
  isSelected?: boolean
  onPress: (data: {
    tripId: Id<"trip">
    orgId: IdAuth<"organization">
    name: string
    logo?: string
    role: Doc<"member">["role"]
  }) => void
}

function TripListItem({ trip, isSelected, onPress }: TripListItemProps) {
  const { user } = useAuthenticatedUser()
  const initials = getInitials(trip.name)
  const bgColor = stringToHex(trip.name)

  const timeLabel = formatDistanceToNow(new Date(trip.updatedAt), {
    addSuffix: true,
  })

  let lastMessagePreview: string
  if (!trip.lastMessage) {
    lastMessagePreview = trip.destination ?? "No messages yet"
  } else if (trip.lastMessage.deletedAt) {
    lastMessagePreview = "[deleted]"
  } else if (trip.lastMessage.senderId === user?._id) {
    lastMessagePreview = `You: ${trip.lastMessage.content}`
  } else {
    lastMessagePreview = trip.lastMessage.content
  }

  return (
    <button
      onClick={() =>
        onPress({
          tripId: trip.tripId,
          orgId: trip.orgId,
          name: trip.name,
          logo: trip.logo,
          role: trip.role,
        })
      }
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-muted/50",
        isSelected && "bg-primary/8 hover:bg-primary/12"
      )}
    >
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full">
        {trip.logo ? (
          <img
            src={trip.logo}
            alt={trip.name}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-lg font-bold text-white"
            style={{ backgroundColor: bgColor }}
          >
            {initials}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <p className="flex-1 truncate text-base font-semibold">{trip.name}</p>
          <p
            className={cn(
              "shrink-0 text-xs",
              trip.unreadCount > 0
                ? "font-semibold text-primary"
                : "text-muted-foreground"
            )}
          >
            {timeLabel}
          </p>
        </div>

        <div className="flex min-w-0 items-center justify-between gap-2">
          <p
            className={cn(
              "flex-1 truncate text-sm",
              trip.unreadCount > 0 ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {lastMessagePreview}
          </p>

          {trip.unreadCount > 0 && (
            <Badge className="min-w-6 justify-center px-1.5 text-xs font-bold">
              {trip.unreadCount >= 100 ? "99+" : trip.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </button>
  )
}

interface TripsListProps {
  trips: TripOrg[]
  isLoading: boolean
  isDone: boolean
  loadMore: () => void
  onPress: (data: {
    tripId: Id<"trip">
    orgId: IdAuth<"organization">
    name: string
    logo?: string
    role: Doc<"member">["role"]
  }) => void
}

export function TripsList({
  trips,
  isLoading,
  isDone,
  loadMore,
  onPress,
}: TripsListProps) {
  const selectedTrip = useAtomValue(selectedTripAtom)

  if (isLoading) {
    return (
      <div className="flex-1">
        <TripListSkeletons />
      </div>
    )
  }

  if (!isLoading && trips.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <p className="text-base text-muted-foreground">No trips found</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {trips.map((trip, i) => (
        <div key={trip.orgId}>
          <TripListItem
            trip={trip}
            onPress={onPress}
            isSelected={selectedTrip?.tripId === trip.tripId}
          />
          {i !== trips.length - 1 && <Separator />}
        </div>
      ))}

      {trips.length > 0 && (
        <InfiniteScrollTrigger
          canLoadMore={!isDone}
          isLoadingMore={isLoading}
          onLoadMore={loadMore}
          noMoreText=""
          className="py-3"
        />
      )}
    </div>
  )
}
