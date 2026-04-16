import { createFileRoute } from "@tanstack/react-router";
import { PlaceDetailView } from "@/modules/plan/ui/views/place-detail-view";
import type { Id } from "@backend/dataModel";

export const Route = createFileRoute("/(layout)/(custom)/place/$placeId")({
    component: RouteComponent,
});

function RouteComponent() {
    const { placeId } = Route.useParams();
    return <PlaceDetailView placeId={placeId as Id<"place">} />;
}
