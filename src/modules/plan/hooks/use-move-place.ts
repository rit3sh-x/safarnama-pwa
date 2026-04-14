import { useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@backend/api";
import type { Id } from "@backend/dataModel";

export interface MovePlaceArgs {
    placeId: Id<"place">;
    dayId: Id<"day">;
    position?: number;
    currentDayPlaceIds?: Id<"place">[];
}

export function useMovePlace() {
    const assignToDay = useMutation(api.methods.places.assignToDay);
    const reorder = useMutation(api.methods.places.reorder);

    return useCallback(
        async ({
            placeId,
            dayId,
            position,
            currentDayPlaceIds,
        }: MovePlaceArgs) => {
            await assignToDay({ placeId, dayId });

            if (position === undefined || !currentDayPlaceIds) return;

            const without = currentDayPlaceIds.filter((id) => id !== placeId);
            const clamped = Math.max(0, Math.min(position, without.length));
            const next: Id<"place">[] = [
                ...without.slice(0, clamped),
                placeId,
                ...without.slice(clamped),
            ];
            await reorder({ dayId, placeIds: next });
        },
        [assignToDay, reorder]
    );
}
