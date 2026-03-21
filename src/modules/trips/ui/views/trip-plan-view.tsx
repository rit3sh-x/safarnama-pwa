import { useState } from "react"
import { useAtomValue } from "jotai"
import { ArrowLeft, Plus, RefreshCw } from "lucide-react"
import { useRouter } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { selectedTripAtom } from "../../atoms"
import { useTripItinerary } from "../../hooks/use-trips"
import {
  DayCard,
  PlanEmptyState,
  GeneratePlanCredenza,
} from "../components/plan"
import type { Id } from "@backend/dataModel"

interface TripPlanViewProps {
  tripId: Id<"trip">
  onBack?: () => void
}

export function TripPlanView({ tripId, onBack }: TripPlanViewProps) {
  const router = useRouter()
  const selectedTrip = useAtomValue(selectedTripAtom)
  const { itinerary, isLoading } = useTripItinerary(tripId)
  const [showGenerate, setShowGenerate] = useState(false)

  const hasItinerary = itinerary && itinerary.length > 0

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-background">
      <div className="flex h-14 shrink-0 items-center border-b bg-card px-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-10"
          onClick={onBack ?? (() => router.history.back())}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <span className="text-base font-semibold">
          {selectedTrip?.name ?? "Plan"}
        </span>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto">
        {isLoading && <PlanSkeleton />}

        {!isLoading && !hasItinerary && <PlanEmptyState />}

        {!isLoading && hasItinerary && (
          <div className="pb-20">
            {itinerary.map((day) => (
              <DayCard
                key={day._id}
                day={day.day}
                date={day.date}
                dayTheme={day.dayTheme}
                items={day.items}
              />
            ))}
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute right-4 bottom-6 z-20 flex justify-end md:right-8">
        <Button
          size="lg"
          className="pointer-events-auto gap-2 rounded-full shadow-lg"
          onClick={() => setShowGenerate(true)}
        >
          {hasItinerary ? (
            <>
              <RefreshCw className="size-5" />
              Regenerate
            </>
          ) : (
            <>
              <Plus className="size-5" />
              Generate Plan
            </>
          )}
        </Button>
      </div>

      <GeneratePlanCredenza
        open={showGenerate}
        onOpenChange={setShowGenerate}
        tripId={tripId}
        hasExistingPlan={!!hasItinerary}
      />
    </div>
  )
}

function PlanSkeleton() {
  return (
    <div>
      {Array.from({ length: 3 }).map((_, dayIdx) => (
        <div key={dayIdx}>
          {/* Day header skeleton */}
          <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3">
            <Skeleton className="size-9 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>

          {/* Items skeleton */}
          <div className="px-4 pt-3">
            {Array.from({ length: 3 }).map((_, itemIdx) => (
              <div key={itemIdx} className="flex gap-3 pl-1">
                <div className="flex flex-col items-center pt-1">
                  <Skeleton className="size-8 rounded-full" />
                  {itemIdx < 2 && <div className="w-px flex-1 bg-border" />}
                </div>
                <div className="mb-4 flex-1 space-y-2.5 rounded-xl border p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-5 w-14 rounded-md" />
                  </div>
                  <Skeleton className="aspect-video w-full rounded-lg" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>

          {dayIdx < 2 && <Separator />}
        </div>
      ))}
    </div>
  )
}
