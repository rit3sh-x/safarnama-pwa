import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/(home)/dashboard")({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/src/app/(home)/dashboard"!</div>
}
