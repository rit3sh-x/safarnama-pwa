import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/(home)/blogs")({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/src/app/(home)/blogs"!</div>
}
