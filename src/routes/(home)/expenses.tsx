import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/(home)/expenses")({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/src/app/(home)/expenses"!</div>
}
