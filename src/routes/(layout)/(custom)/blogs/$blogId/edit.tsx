import { createFileRoute } from "@tanstack/react-router"
import { BlogEditorView } from "@/modules/blog/ui/views/blog-editor-view"

export const Route = createFileRoute("/(layout)/(custom)/blogs/$blogId/edit")({
  component: BlogEditPage,
})

function BlogEditPage() {
  const { blogId } = Route.useParams()
  return <BlogEditorView blogId={blogId} />
}
