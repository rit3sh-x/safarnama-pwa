import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/(custom)/trips/$tripId/info")({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/src/app/(custom)/trips/tripId/info"!</div>
}
