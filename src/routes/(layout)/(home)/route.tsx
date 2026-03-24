import { DashboardLayout } from "@/modules/dashboard/ui/layouts/dashboard-layout";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(layout)/(home)")({
    component: DashboardLayout,
});
