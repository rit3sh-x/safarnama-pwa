import { createFileRoute } from "@tanstack/react-router"
import { BlogViewerView } from "@/modules/blog/ui/views/blog-viewer-view"

export const Route = createFileRoute("/(custom)/blogs/$blogId/")({
  component: BlogViewPage,
})

function BlogViewPage() {
  const { blogId } = Route.useParams()
  return <BlogViewerView blogId={blogId} />
}
