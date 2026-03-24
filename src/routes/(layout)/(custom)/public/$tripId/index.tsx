import { createFileRoute } from "@tanstack/react-router";
import { PublicTripPreview } from "@/modules/trips/ui/views/public-trip-preview";

export const Route = createFileRoute("/(layout)/(custom)/public/$tripId/")({
    component: PublicTripPage,
});

function PublicTripPage() {
    const { tripId } = Route.useParams();
    return <PublicTripPreview tripId={tripId} />;
}
