import { api } from "@backend/api";
import { useQuery } from "convex-helpers/react/cache";

export function useDashboardSummary() {
    const data = useQuery(api.methods.trips.dashboardSummary, {});

    return {
        summary: data,
        isLoading: data === undefined,
    };
}
