import { createFileRoute } from "@tanstack/react-router";
import { DashboardView } from "@/modules/dashboard/ui/views/dashboard-view";

export const Route = createFileRoute("/(layout)/(home)/dashboard")({
    component: DashboardView,
});
