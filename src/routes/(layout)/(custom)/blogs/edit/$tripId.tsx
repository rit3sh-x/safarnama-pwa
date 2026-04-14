import { createFileRoute } from "@tanstack/react-router";
import { BlogEditorView } from "@/modules/blog/ui/views/blog-editor-view";
import type { Id } from "@backend/dataModel";

export const Route = createFileRoute("/(layout)/(custom)/blogs/edit/$tripId")({
    component: BlogEditPage,
});

function BlogEditPage() {
    const { tripId } = Route.useParams();
    return <BlogEditorView tripId={tripId as Id<"trip">} />;
}
