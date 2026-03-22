import { createFileRoute } from "@tanstack/react-router"
import { BlogListView } from "@/modules/blog/ui/views/blog-list-view"

export const Route = createFileRoute("/(home)/blogs")({
  component: BlogListView,
})
