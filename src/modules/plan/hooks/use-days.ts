import { api } from "@backend/api";
import { useMutation } from "convex/react";
import type { OptimisticLocalStore } from "convex/browser";
import { useQuery } from "convex-helpers/react/cache";
import type { FunctionArgs } from "convex/server";
import { useState } from "react";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import type { Id } from "@backend/dataModel";

function updateDayInStore(
    localStore: OptimisticLocalStore,
    dayId: Id<"day">,
    updater: (day: Record<string, unknown>) => Record<string, unknown>
) {
    const queries = localStore.getAllQueries(api.methods.days.list);
    for (const { args, value } of queries) {
        if (!args || !value) continue;
        const days = value as Record<string, unknown>[];
        const idx = days.findIndex((d) => d._id === dayId);
        if (idx === -1) continue;
        const updated = [...days];
        updated[idx] = updater(updated[idx]);
        localStore.setQuery(
            api.methods.days.list,
            args,
            updated as typeof value
        );
        break;
    }
}

function removeDayFromStore(
    localStore: OptimisticLocalStore,
    dayId: Id<"day">
) {
    const queries = localStore.getAllQueries(api.methods.days.list);
    for (const { args, value } of queries) {
        if (!args || !value) continue;
        const days = value as Record<string, unknown>[];
        const filtered = days.filter((d) => d._id !== dayId);
        if (filtered.length !== days.length) {
            localStore.setQuery(
                api.methods.days.list,
                args,
                filtered as typeof value
            );
        }
    }
}

export function useDays(tripId: Id<"trip"> | undefined) {
    const data = useQuery(api.methods.days.list, tripId ? { tripId } : "skip");

    return {
        days: data ?? [],
        isLoading: data === undefined,
    };
}

export function useDay(dayId: Id<"day"> | undefined) {
    const data = useQuery(api.methods.days.get, dayId ? { dayId } : "skip");

    return {
        day: data,
        isLoading: data === undefined,
    };
}

export const useAddDay = () => {
    const [isPending, setIsPending] = useState(false);
    const addDay = useMutation(api.methods.days.add).withOptimisticUpdate(
        (localStore, args) => {
            const queries = localStore.getAllQueries(api.methods.days.list);
            for (const { args: qArgs, value } of queries) {
                if (!qArgs || !value || qArgs.tripId !== args.tripId) continue;
                const days = value as Record<string, unknown>[];
                const optimisticDay = {
                    _id: nanoid(10) as Id<"day">,
                    _creationTime: Date.now(),
                    tripId: args.tripId,
                    dayNumber: args.dayNumber,
                    date: args.date,
                    title: args.title,
                    note: args.note,
                };
                localStore.setQuery(api.methods.days.list, qArgs, [
                    ...days,
                    optimisticDay,
                ] as typeof value);
                break;
            }
        }
    );

    const mutate = async (args: FunctionArgs<typeof api.methods.days.add>) => {
        setIsPending(true);
        try {
            return await addDay(args);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to add day"
            );
            throw err;
        } finally {
            setIsPending(false);
        }
    };

    return { mutate, isPending };
};

export const useUpsertDay = () => {
    const [isPending, setIsPending] = useState(false);
    const upsertDay = useMutation(
        api.methods.days.upsert
    ).withOptimisticUpdate((localStore, args) => {
        const queries = localStore.getAllQueries(api.methods.days.list);
        for (const { args: qArgs, value } of queries) {
            if (!qArgs || !value || qArgs.tripId !== args.tripId) continue;
            const days = value as Record<string, unknown>[];
            const exists = days.some(
                (d) =>
                    (d as { dayNumber: number }).dayNumber === args.dayNumber
            );
            if (exists) break;
            const optimisticDay = {
                _id: nanoid(10) as Id<"day">,
                _creationTime: Date.now(),
                tripId: args.tripId,
                dayNumber: args.dayNumber,
                date: args.date,
                title: args.title,
                note: args.note,
            };
            localStore.setQuery(api.methods.days.list, qArgs, [
                ...days,
                optimisticDay,
            ] as typeof value);
            break;
        }
    });

    const mutate = async (args: FunctionArgs<typeof api.methods.days.upsert>) => {
        setIsPending(true);
        try {
            return await upsertDay(args);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to upsert day"
            );
            throw err;
        } finally {
            setIsPending(false);
        }
    };

    return { mutate, isPending };
};

export const useUpdateDay = () => {
    const [isPending, setIsPending] = useState(false);
    const updateDay = useMutation(api.methods.days.update).withOptimisticUpdate(
        (localStore, args) => {
            updateDayInStore(localStore, args.dayId, (day) => ({
                ...day,
                ...(args.title !== undefined && { title: args.title }),
                ...(args.date !== undefined && { date: args.date }),
                ...(args.note !== undefined && { note: args.note }),
            }));
        }
    );

    const mutate = async (
        args: FunctionArgs<typeof api.methods.days.update>
    ) => {
        setIsPending(true);
        try {
            await updateDay(args);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to update day"
            );
        } finally {
            setIsPending(false);
        }
    };

    return { mutate, isPending };
};

export const useRemoveDay = () => {
    const [isPending, setIsPending] = useState(false);
    const removeDay = useMutation(api.methods.days.remove).withOptimisticUpdate(
        (localStore, args) => {
            removeDayFromStore(localStore, args.dayId);
            const placeQueries = localStore.getAllQueries(
                api.methods.places.listByDay
            );
            for (const { args: qArgs, value } of placeQueries) {
                if (!qArgs || !value || qArgs.dayId !== args.dayId) continue;
                localStore.setQuery(
                    api.methods.places.listByDay,
                    qArgs,
                    [] as typeof value
                );
            }
            const allPages = localStore.getAllQueries(api.methods.places.list);
            for (const { args: qArgs, value } of allPages) {
                if (!qArgs || !value) continue;
                const page = value.page as Record<string, unknown>[];
                const updated = page.map((p) =>
                    p.dayId === args.dayId ? { ...p, dayId: undefined } : p
                );
                localStore.setQuery(api.methods.places.list, qArgs, {
                    ...value,
                    page: updated,
                } as typeof value);
            }
        }
    );

    const mutate = async (
        args: FunctionArgs<typeof api.methods.days.remove>
    ) => {
        setIsPending(true);
        try {
            await removeDay(args);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to remove day"
            );
        } finally {
            setIsPending(false);
        }
    };

    return { mutate, isPending };
};

export const useAddPlaceToDay = () => {
    const [isPending, setIsPending] = useState(false);
    const addPlaceToDay = useMutation(
        api.methods.days.addPlaceToDay
    ).withOptimisticUpdate((localStore, args) => {
        const allPages = localStore.getAllQueries(api.methods.places.list);
        for (const { args: qArgs, value } of allPages) {
            if (!qArgs || !value) continue;
            const page = value.page as Record<string, unknown>[];
            const idx = page.findIndex((p) => p._id === args.placeId);
            if (idx === -1) continue;
            const updated = [...page];
            updated[idx] = { ...updated[idx], dayId: args.dayId };
            localStore.setQuery(api.methods.places.list, qArgs, {
                ...value,
                page: updated,
            } as typeof value);
            break;
        }
        const placeQueries = localStore.getAllQueries(
            api.methods.places.listByDay
        );
        for (const { args: qArgs, value } of placeQueries) {
            if (!qArgs || !value) continue;
            const places = value as Record<string, unknown>[];
            const filtered = places.filter((p) => p._id !== args.placeId);
            if (filtered.length !== places.length) {
                localStore.setQuery(
                    api.methods.places.listByDay,
                    qArgs,
                    filtered as typeof value
                );
            }
        }
    });

    const mutate = async (
        args: FunctionArgs<typeof api.methods.days.addPlaceToDay>
    ) => {
        setIsPending(true);
        try {
            await addPlaceToDay(args);
        } catch (err) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : "Failed to add place to day"
            );
        } finally {
            setIsPending(false);
        }
    };

    return { mutate, isPending };
};

export const useRemovePlaceFromDay = () => {
    const [isPending, setIsPending] = useState(false);
    const removePlaceFromDay = useMutation(
        api.methods.days.removePlaceFromDay
    ).withOptimisticUpdate((localStore, args) => {
        const placeQueries = localStore.getAllQueries(
            api.methods.places.listByDay
        );
        for (const { args: qArgs, value } of placeQueries) {
            if (!qArgs || !value) continue;
            const places = value as Record<string, unknown>[];
            const filtered = places.filter((p) => p._id !== args.placeId);
            if (filtered.length !== places.length) {
                localStore.setQuery(
                    api.methods.places.listByDay,
                    qArgs,
                    filtered as typeof value
                );
            }
        }
    });

    const mutate = async (
        args: FunctionArgs<typeof api.methods.days.removePlaceFromDay>
    ) => {
        setIsPending(true);
        try {
            await removePlaceFromDay(args);
        } catch (err) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : "Failed to remove place from day"
            );
        } finally {
            setIsPending(false);
        }
    };

    return { mutate, isPending };
};

export const useUpdateDayNote = () => {
    const [isPending, setIsPending] = useState(false);
    const updateNote = useMutation(
        api.methods.days.updateNote
    ).withOptimisticUpdate((localStore, args) => {
        updateDayInStore(localStore, args.dayId, (day) => ({
            ...day,
            note: args.note,
        }));
    });

    const mutate = async (
        args: FunctionArgs<typeof api.methods.days.updateNote>
    ) => {
        setIsPending(true);
        try {
            await updateNote(args);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to update note"
            );
        } finally {
            setIsPending(false);
        }
    };

    return { mutate, isPending };
};

export const useRemoveDayNote = () => {
    const [isPending, setIsPending] = useState(false);
    const removeNote = useMutation(
        api.methods.days.removeNote
    ).withOptimisticUpdate((localStore, args) => {
        updateDayInStore(localStore, args.dayId, (day) => ({
            ...day,
            note: undefined,
        }));
    });

    const mutate = async (
        args: FunctionArgs<typeof api.methods.days.removeNote>
    ) => {
        setIsPending(true);
        try {
            await removeNote(args);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to remove note"
            );
        } finally {
            setIsPending(false);
        }
    };

    return { mutate, isPending };
};
