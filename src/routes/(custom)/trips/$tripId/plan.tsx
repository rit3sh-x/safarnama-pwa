import { createFileRoute } from "@tanstack/react-router"
import { TripPlanView } from "@/modules/trips/ui/views/trip-plan-view"

export const Route = createFileRoute("/(custom)/trips/$tripId/plan")({
  component: RouteComponent,
})

function RouteComponent() {
  const { tripId } = Route.useParams()
  return <TripPlanView tripId={tripId} />
}
