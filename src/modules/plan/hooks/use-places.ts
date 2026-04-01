import { PAGINATION } from "@/lib/constants";
import { api } from "@backend/api";
import { useMutation, usePaginatedQuery } from "convex/react";
import type { OptimisticLocalStore } from "convex/browser";
import { useQuery } from "convex-helpers/react/cache";
import type { FunctionArgs } from "convex/server";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import { searchNominatim, fetchWikimediaPhoto } from "../utils";
import type { Id } from "@backend/dataModel";

function updatePlaceInPaginatedStore(
    localStore: OptimisticLocalStore,
    placeId: Id<"place">,
    updater: (place: Record<string, unknown>) => Record<string, unknown>
) {
    const allPages = localStore.getAllQueries(api.methods.places.list);
    for (const { args, value } of allPages) {
        if (!args || !value) continue;
        const page = value.page as Record<string, unknown>[];
        const idx = page.findIndex((p) => p._id === placeId);
        if (idx === -1) continue;
        const updated = [...page];
        updated[idx] = updater(updated[idx]);
        localStore.setQuery(api.methods.places.list, args, {
            ...value,
            page: updated,
        } as typeof value);
        break;
    }
}

function removePlaceFromPaginatedStore(
    localStore: OptimisticLocalStore,
    placeId: Id<"place">
) {
    const allPages = localStore.getAllQueries(api.methods.places.list);
    for (const { args, value } of allPages) {
        if (!args || !value) continue;
        const page = value.page as Record<string, unknown>[];
        const filtered = page.filter((p) => p._id !== placeId);
        if (filtered.length !== page.length) {
            localStore.setQuery(api.methods.places.list, args, {
                ...value,
                page: filtered,
            } as typeof value);
        }
    }
}

function removePlaceFromDayStore(
    localStore: OptimisticLocalStore,
    placeId: Id<"place">
) {
    const queries = localStore.getAllQueries(api.methods.places.listByDay);
    for (const { args, value } of queries) {
        if (!args || !value) continue;
        const places = value as Record<string, unknown>[];
        const filtered = places.filter((p) => p._id !== placeId);
        if (filtered.length !== places.length) {
            localStore.setQuery(
                api.methods.places.listByDay,
                args,
                filtered as typeof value
            );
        }
    }
}

export function usePlaces(
    tripId: Id<"trip"> | undefined,
    options?: { category?: string; search?: string }
) {
    const { results, status, loadMore } = usePaginatedQuery(
        api.methods.places.list,
        tripId
            ? {
                  tripId,
                  search: options?.search,
              }
            : "skip",
        { initialNumItems: PAGINATION.MESSAGES_PAGE_SIZE }
    );

    return {
        places: results ?? [],
        isLoading: status === "LoadingFirstPage",
        canLoadMore: status === "CanLoadMore",
        loadMore: () => loadMore(PAGINATION.MESSAGES_PAGE_SIZE),
    };
}

export function usePlacesByDay(
    tripId: Id<"trip"> | undefined,
    dayId: Id<"day"> | undefined
) {
    const data = useQuery(
        api.methods.places.listByDay,
        tripId && dayId ? { tripId, dayId } : "skip"
    );

    return {
        places: data ?? [],
        isLoading: data === undefined,
    };
}

export function usePlace(placeId: Id<"place"> | undefined) {
    const data = useQuery(
        api.methods.places.get,
        placeId ? { placeId } : "skip"
    );

    return {
        place: data,
        isLoading: data === undefined,
    };
}

export const useAddPlace = () => {
    const [isPending, setIsPending] = useState(false);
    const addPlace = useMutation(api.methods.places.add).withOptimisticUpdate(
        (localStore, args) => {
            const allPages = localStore.getAllQueries(api.methods.places.list);
            for (const { args: qArgs, value } of allPages) {
                if (!qArgs || !value || qArgs.tripId !== args.tripId) continue;
                const optimisticPlace = {
                    _id: nanoid(10) as Id<"place">,
                    _creationTime: Date.now(),
                    tripId: args.tripId,
                    dayId: args.dayId,
                    name: args.name,
                    description: args.description,
                    lat: args.lat,
                    lng: args.lng,
                    address: args.address,
                    imageUrl: args.imageUrl,
                    osmId: args.osmId,
                    placeTime: args.placeTime,
                    endTime: args.endTime,
                };
                localStore.setQuery(api.methods.places.list, qArgs, {
                    ...value,
                    page: [
                        ...(value.page as Record<string, unknown>[]),
                        optimisticPlace,
                    ],
                } as typeof value);
                break;
            }
        }
    );

    const mutate = async (
        args: FunctionArgs<typeof api.methods.places.add>
    ) => {
        setIsPending(true);
        try {
            return await addPlace(args);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to add place"
            );
            throw err;
        } finally {
            setIsPending(false);
        }
    };

    return { mutate, isPending };
};

export const useUpdatePlace = () => {
    const [isPending, setIsPending] = useState(false);
    const updatePlace = useMutation(
        api.methods.places.update
    ).withOptimisticUpdate((localStore, args) => {
        const { placeId, ...fields } = args;
        updatePlaceInPaginatedStore(localStore, placeId, (place) => ({
            ...place,
            ...fields,
        }));
    });

    const mutate = async (
        args: FunctionArgs<typeof api.methods.places.update>
    ) => {
        setIsPending(true);
        try {
            await updatePlace(args);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to update place"
            );
        } finally {
            setIsPending(false);
        }
    };

    return { mutate, isPending };
};

export const useAssignPlaceToDay = () => {
    const [isPending, setIsPending] = useState(false);
    const assignPlace = useMutation(
        api.methods.places.assignToDay
    ).withOptimisticUpdate((localStore, args) => {
        updatePlaceInPaginatedStore(localStore, args.placeId, (place) => ({
            ...place,
            dayId: args.dayId,
        }));

        removePlaceFromDayStore(localStore, args.placeId);
    });

    const mutate = async (
        args: FunctionArgs<typeof api.methods.places.assignToDay>
    ) => {
        setIsPending(true);
        try {
            await assignPlace(args);
        } catch (err) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : "Failed to assign place to day"
            );
        } finally {
            setIsPending(false);
        }
    };

    return { mutate, isPending };
};

export const useRemovePlace = () => {
    const [isPending, setIsPending] = useState(false);
    const removePlace = useMutation(
        api.methods.places.remove
    ).withOptimisticUpdate((localStore, args) => {
        removePlaceFromPaginatedStore(localStore, args.placeId);
        removePlaceFromDayStore(localStore, args.placeId);
    });

    const mutate = async (
        args: FunctionArgs<typeof api.methods.places.remove>
    ) => {
        setIsPending(true);
        try {
            await removePlace(args);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to remove place"
            );
        } finally {
            setIsPending(false);
        }
    };

    return { mutate, isPending };
};

export const useReorderPlaces = () => {
    const [isPending, setIsPending] = useState(false);
    const reorder = useMutation(
        api.methods.places.reorder
    ).withOptimisticUpdate((localStore, args) => {
        const queries = localStore.getAllQueries(api.methods.places.listByDay);
        for (const { args: qArgs, value } of queries) {
            if (!qArgs || !value || qArgs.dayId !== args.dayId) continue;
            const places = value as Record<string, unknown>[];
            const reordered = args.placeIds
                .map((id, i) => {
                    const place = places.find((p) => p._id === id);
                    return place ? { ...place, order: i } : null;
                })
                .filter(Boolean);
            localStore.setQuery(
                api.methods.places.listByDay,
                qArgs,
                reordered as typeof value
            );
            break;
        }
    });

    const mutate = async (
        args: FunctionArgs<typeof api.methods.places.reorder>
    ) => {
        setIsPending(true);
        try {
            await reorder(args);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to reorder"
            );
        } finally {
            setIsPending(false);
        }
    };

    return { mutate, isPending };
};

export interface PlaceSearchResult {
    osmId: string;
    name: string;
    address: string;
    lat: number | null;
    lng: number | null;
}

export function useNominatimSearch() {
    const [results, setResults] = useState<PlaceSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const search = useCallback(async (query: string) => {
        if (!query.trim()) {
            setResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const data = await searchNominatim(query);
            setResults(data);
        } catch {
            toast.error("Search failed");
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    const clear = useCallback(() => setResults([]), []);

    return { results, isSearching, search, clear };
}

export const useAddPlaceWithPhoto = () => {
    const { mutate: addPlace, isPending: isAdding } = useAddPlace();
    const { mutate: updatePlace } = useUpdatePlace();
    const [isPending, setIsPending] = useState(false);

    const mutate = useCallback(
        async (args: FunctionArgs<typeof api.methods.places.add>) => {
            setIsPending(true);
            try {
                const placeId = await addPlace(args);

                if (args.lat && args.lng) {
                    fetchWikimediaPhoto(args.lat, args.lng, args.name)
                        .then((result) => {
                            if (result?.photoUrl && placeId) {
                                updatePlace({
                                    placeId,
                                    imageUrl: result.photoUrl,
                                });
                            }
                        })
                        .catch(() => {});
                }

                return placeId;
            } catch (err) {
                toast.error(
                    err instanceof Error ? err.message : "Failed to add place"
                );
                throw err;
            } finally {
                setIsPending(false);
            }
        },
        [addPlace, updatePlace]
    );

    return { mutate, isPending: isPending || isAdding };
};
