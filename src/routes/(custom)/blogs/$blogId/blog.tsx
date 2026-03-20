import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/(custom)/blogs/$blogId/blog")({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/src/app/(custom)/blogs/blogId/blog"!</div>
}
