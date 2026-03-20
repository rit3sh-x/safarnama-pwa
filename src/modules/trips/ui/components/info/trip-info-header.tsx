import { getInitials, stringToHex } from "@/lib/utils"
import { MapPin, Calendar, Globe, Lock } from "lucide-react"
import { useTripDetails } from "../../../hooks/use-trips"
import { Skeleton } from "@/components/ui/skeleton"
import type { Id } from "@backend/dataModel"

interface TripInfoHeaderProps {
  name: string
  tripId: Id<"trip">
  logo?: string
  memberCount: number
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function TripInfoHeader({
  name,
  tripId,
  logo,
  memberCount,
}: TripInfoHeaderProps) {
  const trip = useTripDetails(tripId)
  const initials = getInitials(name)
  const bgColor = stringToHex(tripId)

  const dateRange =
    trip?.startDate && trip?.endDate
      ? `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`
      : trip?.startDate
        ? `From ${formatDate(trip.startDate)}`
        : null

  return (
    <div className="flex flex-col items-center gap-4 px-6 pt-8 pb-6">
      <div className="size-24 overflow-hidden rounded-full shadow-md">
        {logo ? (
          <img src={logo} alt={name} className="size-full object-cover" />
        ) : (
          <div
            className="flex size-full items-center justify-center text-2xl font-bold text-white"
            style={{ backgroundColor: bgColor }}
          >
            {initials}
          </div>
        )}
      </div>

      <div className="text-center">
        <h1 className="text-xl font-semibold text-foreground">{name}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {memberCount} {memberCount === 1 ? "member" : "members"}
        </p>
      </div>

      {!trip ? (
        <DetailsSkeleton />
      ) : (
        <div className="flex w-full max-w-sm flex-col gap-2.5 rounded-xl bg-muted/50 px-4 py-3">
          <DetailRow
            icon={<MapPin className="size-4 text-muted-foreground" />}
            label="Destination"
            value={trip.destination}
          />
          {dateRange && (
            <DetailRow
              icon={<Calendar className="size-4 text-muted-foreground" />}
              label="Dates"
              value={dateRange}
            />
          )}
          {trip.description && (
            <p className="text-sm text-muted-foreground">{trip.description}</p>
          )}
          <DetailRow
            icon={
              trip.isPublic ? (
                <Globe className="size-4 text-muted-foreground" />
              ) : (
                <Lock className="size-4 text-muted-foreground" />
              )
            }
            label="Visibility"
            value={trip.isPublic ? "Public" : "Private"}
          />
        </div>
      )}
    </div>
  )
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-2.5">
      {icon}
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="ml-auto text-sm font-medium text-foreground">
        {value}
      </span>
    </div>
  )
}

function DetailsSkeleton() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-2.5 rounded-xl bg-muted/50 px-4 py-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2.5">
          <Skeleton className="size-4 rounded" />
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className="ml-auto h-3.5 w-24" />
        </div>
      ))}
    </div>
  )
}
