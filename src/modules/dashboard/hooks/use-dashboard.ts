import { api } from "@backend/api";
import { useQuery } from "convex-helpers/react/cache";

export function useDashboardSummary() {
    const data = useQuery(api.methods.trips.dashboardSummary, {});

    return {
        summary: data,
        isLoading: data === undefined,
    };
}

export function useRecommendedBlogs() {
    const data = useQuery(api.methods.blogs.recommended, {});
    return { blogs: data ?? [], isLoading: data === undefined };
}

export function useRecommendedPlaces() {
    const data = useQuery(api.methods.places.recommended, {});
    return { places: data ?? [], isLoading: data === undefined };
}
