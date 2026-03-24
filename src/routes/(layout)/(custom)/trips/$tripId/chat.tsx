import { createFileRoute } from "@tanstack/react-router";
import { TripChatView } from "@/modules/trips/ui/views/trip-chat-view";

export const Route = createFileRoute("/(layout)/(custom)/trips/$tripId/chat")({
    component: Page,
});

function Page() {
    const { tripId } = Route.useParams();
    return <TripChatView tripId={tripId} />;
}
