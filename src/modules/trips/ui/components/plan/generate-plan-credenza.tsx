import { useState } from "react"
import { CalendarIcon, Sparkles, Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Credenza,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaDescription,
  CredenzaBody,
  CredenzaFooter,
} from "@/components/ui/credenza"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useGenerateItinerary } from "../../../hooks/use-trips"
import { useTripDetails, useUpdateTrip } from "../../../hooks/use-trips"
import type { Id } from "@backend/dataModel"

function toDateInputValue(timestamp?: number) {
  if (!timestamp) return ""
  return new Date(timestamp).toISOString().split("T")[0]
}

interface GeneratePlanCredenzaProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tripId: Id<"trip">
  hasExistingPlan: boolean
}

export function GeneratePlanCredenza({
  open,
  onOpenChange,
  tripId,
  hasExistingPlan,
}: GeneratePlanCredenzaProps) {
  const { trip } = useTripDetails(tripId)

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent>
        {open && trip ? (
          <GeneratePlanForm
            tripId={tripId}
            hasExistingPlan={hasExistingPlan}
            initialStartDate={toDateInputValue(trip.startDate)}
            initialEndDate={toDateInputValue(trip.endDate)}
            tripStartDate={trip.startDate}
            tripEndDate={trip.endDate}
            onClose={() => onOpenChange(false)}
          />
        ) : open ? (
          <CredenzaFormSkeleton />
        ) : null}
      </CredenzaContent>
    </Credenza>
  )
}

function GeneratePlanForm({
  tripId,
  hasExistingPlan,
  initialStartDate,
  initialEndDate,
  tripStartDate,
  tripEndDate,
  onClose,
}: {
  tripId: Id<"trip">
  hasExistingPlan: boolean
  initialStartDate: string
  initialEndDate: string
  tripStartDate?: number
  tripEndDate?: number
  onClose: () => void
}) {
  const { mutate: generate, isPending: isGenerating } = useGenerateItinerary()
  const { mutate: updateTrip, isPending: isUpdating } = useUpdateTrip()

  const [startDate, setStartDate] = useState(initialStartDate)
  const [endDate, setEndDate] = useState(initialEndDate)
  const [userPrompt, setUserPrompt] = useState("")

  const isPending = isGenerating || isUpdating
  const datesValid = startDate && endDate

  const handleGenerate = async () => {
    if (!datesValid) return

    const newStart = new Date(startDate).getTime()
    const newEnd = new Date(endDate).getTime()
    const datesChanged = newStart !== tripStartDate || newEnd !== tripEndDate

    if (datesChanged) {
      await updateTrip({
        tripId,
        startDate: newStart,
        endDate: newEnd,
      })
    }

    await generate({ tripId, userPrompt: userPrompt.trim() || undefined })
    onClose()
  }

  return (
    <>
      <CredenzaHeader>
        <CredenzaTitle>
          {hasExistingPlan ? "Regenerate Plan" : "Generate Plan"}
        </CredenzaTitle>
        <CredenzaDescription>
          {hasExistingPlan
            ? "This will replace your current itinerary with a new AI-generated plan."
            : "Create an AI-powered day-by-day itinerary for your trip."}
        </CredenzaDescription>
      </CredenzaHeader>

      <CredenzaBody className="space-y-4">
        <div className="space-y-3 rounded-lg border border-border bg-muted/50 p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <CalendarIcon className="size-4 text-muted-foreground" />
            Trip dates
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="start-date" className="text-xs">
                Start date
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end-date" className="text-xs">
                End date
              </Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="preferences" className="text-xs">
            Preferences (optional)
          </Label>
          <Textarea
            id="preferences"
            placeholder="e.g., Focus on street food and temples, budget-friendly options..."
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>
      </CredenzaBody>

      <CredenzaFooter>
        <Button
          onClick={handleGenerate}
          disabled={isPending || !datesValid}
          className="w-full gap-2"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          {isPending
            ? "Generating..."
            : hasExistingPlan
              ? "Regenerate Plan"
              : "Generate Plan"}
        </Button>
      </CredenzaFooter>
    </>
  )
}

function CredenzaFormSkeleton() {
  return (
    <>
      <CredenzaHeader>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64" />
      </CredenzaHeader>
      <CredenzaBody className="space-y-4">
        <div className="space-y-3 rounded-lg border border-border bg-muted/50 p-3">
          <Skeleton className="h-4 w-24" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-9 w-full rounded-md" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-20 w-full rounded-md" />
        </div>
      </CredenzaBody>
      <CredenzaFooter>
        <Skeleton className="h-10 w-full rounded-md" />
      </CredenzaFooter>
    </>
  )
}
