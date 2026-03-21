import { Map } from "lucide-react"

export function PlanEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-muted">
        <Map className="size-10 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xl font-semibold text-foreground">No plan yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Tap the button below to generate an AI-powered itinerary
        </p>
      </div>
    </div>
  )
}
