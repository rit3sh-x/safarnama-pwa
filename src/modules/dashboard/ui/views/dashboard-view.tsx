import { useDashboardSummary } from "../../hooks/use-dashboard";
import { useGlobalExpenseSummary } from "@/modules/expense/hooks/use-expenses";
import { DashboardGreeting } from "../components/dashboard-greeting";
import { DashboardStats } from "../components/dashboard-stats";
import { DashboardUpcomingTrips } from "../components/dashboard-upcoming-trips";
import { DashboardRecentActivity } from "../components/dashboard-recent-activity";
import { DashboardQuickActions } from "../components/dashboard-quick-actions";

export function DashboardView() {
    const { summary, isLoading } = useDashboardSummary();
    const { summary: expenseSummary, isLoading: expenseLoading } =
        useGlobalExpenseSummary();

    return (
        <div className="flex h-full flex-col overflow-y-auto">
            <div className="mx-auto w-full max-w-4xl space-y-6 p-4 pb-8">
                <DashboardGreeting />

                <DashboardStats
                    totalTrips={summary?.totalTrips ?? 0}
                    totalSpent={expenseSummary?.totalSpent ?? 0}
                    totalBlogs={summary?.totalBlogs ?? 0}
                    isLoading={isLoading || expenseLoading}
                />

                <DashboardUpcomingTrips
                    trips={summary?.upcomingTrips ?? []}
                    isLoading={isLoading}
                />

                <DashboardQuickActions />

                <DashboardRecentActivity
                    messages={summary?.recentMessages ?? []}
                    isLoading={isLoading}
                />
            </div>
        </div>
    );
}
