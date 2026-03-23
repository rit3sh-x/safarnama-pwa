import { createFileRoute } from "@tanstack/react-router"
import { TripInfoView } from "@/modules/trips/ui/views/trip-info-view"

export const Route = createFileRoute("/(layout)/(custom)/trips/$tripId/info")({
  component: RouteComponent,
})

function RouteComponent() {
  const { tripId } = Route.useParams()
  return <TripInfoView tripId={tripId} />
}
