import { createFileRoute } from "@tanstack/react-router";
import { PlanView } from "@/modules/plan/ui/views/plan-view";
import type { Id } from "@backend/dataModel";

export const Route = createFileRoute("/(layout)/(custom)/plan/$tripId")({
    component: RouteComponent,
});

function RouteComponent() {
    const { tripId } = Route.useParams();
    return <PlanView tripId={tripId as Id<"trip">} />;
}
