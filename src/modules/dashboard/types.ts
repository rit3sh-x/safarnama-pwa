import type { FunctionReturnType } from "convex/server";
import { api } from "@backend/api";

export type DashboardSummary = FunctionReturnType<
    typeof api.methods.trips.dashboardSummary
>;

export type RecentMessage = DashboardSummary["recentMessages"][number];
export type UpcomingTrip = DashboardSummary["upcomingTrips"][number];
export type ActiveTrip = DashboardSummary["activeTrips"][number];
