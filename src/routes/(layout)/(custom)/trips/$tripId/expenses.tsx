import { createFileRoute } from "@tanstack/react-router"
import { TripExpenseView } from "@/modules/expense/ui/views/trip-expense-view"

export const Route = createFileRoute("/(layout)/(custom)/trips/$tripId/expenses")({
  component: RouteComponent,
})

function RouteComponent() {
  const { tripId } = Route.useParams()
  return <TripExpenseView tripId={tripId} />
}
