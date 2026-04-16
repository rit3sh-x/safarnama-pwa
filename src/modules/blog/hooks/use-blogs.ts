import { PAGINATION } from "@/lib/constants";
import { api } from "@backend/api";
import { useMutation, usePaginatedQuery } from "convex/react";
import { useQuery } from "convex-helpers/react/cache";
import type { FunctionArgs } from "convex/server";
import { useState } from "react";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import type { Id } from "@backend/dataModel";
import type { RatingValue } from "@backend/types";
import type { BlogFilters } from "../atoms";

export function useBlog(blogId: Id<"blog">) {
    const data = useQuery(api.methods.blogs.getById, { blogId });

    return {
        blog: data,
        isLoading: data === undefined,
    };
}

export function useBlogByTrip(tripId: Id<"trip">) {
    const data = useQuery(api.methods.blogs.get, { tripId });

    return {
        blog: data,
        isLoading: data === undefined,
    };
}

export function useBrowseBlogs(
    search?: string,
    filters?: Partial<BlogFilters>
) {
    const { results, status, loadMore } = usePaginatedQuery(
        api.methods.blogs.browse,
        {
            search: search?.trim() || undefined,
            tags:
                filters?.tags && filters.tags.length > 0
                    ? filters.tags
                    : undefined,
            minBudget: filters?.minBudget,
            maxBudget: filters?.maxBudget,
            minDays: filters?.minDays,
            maxDays: filters?.maxDays,
            nearLat: filters?.nearMe?.lat,
            nearLng: filters?.nearMe?.lng,
            radiusKm: filters?.nearMe?.radiusKm,
        },
        { initialNumItems: PAGINATION.BLOGS_PAGE_SIZE }
    );

    return {
        blogs: results,
        isLoading: status === "LoadingFirstPage",
        isDone: status === "Exhausted",
        loadMore: () => loadMore(PAGINATION.BLOGS_PAGE_SIZE),
    };
}

export const useSaveBlog = () => {
    const [isPending, setIsPending] = useState(false);
    const upsertBlog = useMutation(
        api.methods.blogs.upsert
    ).withOptimisticUpdate((localStore, args) => {
        const now = Date.now();

        const currentTripBlog = localStore.getQuery(api.methods.blogs.get, {
            tripId: args.tripId,
        });

        const optimisticBlog = {
            _id:
                (currentTripBlog?._id as Id<"blog"> | undefined) ??
                (nanoid(10) as Id<"blog">),
            _creationTime: currentTripBlog?._creationTime ?? now,
            tripId: args.tripId,
            title: args.title,
            content: args.content,
            coverImage: args.coverImage,
            tags: args.tags ?? currentTripBlog?.tags,
            startDate: args.startDate ?? currentTripBlog?.startDate,
            endDate: args.endDate ?? currentTripBlog?.endDate,
            budget: args.budget ?? currentTripBlog?.budget,
            currency: args.currency ?? currentTripBlog?.currency,
            placeIds: args.placeIds ?? currentTripBlog?.placeIds,
            publishedAt: currentTripBlog?.publishedAt ?? now,
            updatedAt: now,
            tripTitle: currentTripBlog?.tripTitle ?? "",
            tripDestination: currentTripBlog?.tripDestination ?? "",
            _optimistic: true,
        };

        localStore.setQuery(
            api.methods.blogs.get,
            { tripId: args.tripId },
            optimisticBlog
        );

        if (currentTripBlog?._id) {
            const existing = localStore.getQuery(api.methods.blogs.getById, {
                blogId: currentTripBlog._id,
            });
            localStore.setQuery(
                api.methods.blogs.getById,
                { blogId: currentTripBlog._id },
                {
                    ...optimisticBlog,
                    isOwner: true,
                    tripIsPublic: existing?.tripIsPublic ?? false,
                    avgRating: existing?.avgRating ?? 0,
                    totalRatings: existing?.totalRatings ?? 0,
                    distribution:
                        existing?.distribution ??
                        ({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<
                            RatingValue,
                            number
                        >),
                    userRating: existing?.userRating ?? null,
                    places: existing?.places ?? [],
                }
            );
        }
    });

    const mutate = async (
        args: FunctionArgs<typeof api.methods.blogs.upsert>
    ) => {
        setIsPending(true);
        try {
            return await upsertBlog(args);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to save blog"
            );
        } finally {
            setIsPending(false);
        }
    };

    return { mutate, isPending };
};

export const useRemoveBlog = () => {
    const [isPending, setIsPending] = useState(false);
    const removeBlog = useMutation(
        api.methods.blogs.remove
    ).withOptimisticUpdate((localStore, args) => {
        const allPages = localStore.getAllQueries(api.methods.blogs.browse);
        for (const { args: queryArgs, value } of allPages) {
            if (!queryArgs || !value) continue;
            const page = value.page as Record<string, unknown>[];
            const filtered = page.filter((b) => b.tripId !== args.tripId);
            if (filtered.length !== page.length) {
                localStore.setQuery(api.methods.blogs.browse, queryArgs, {
                    ...value,
                    page: filtered,
                } as typeof value);
            }
        }

        localStore.setQuery(
            api.methods.blogs.get,
            { tripId: args.tripId },
            null
        );
    });

    const mutate = async (
        args: FunctionArgs<typeof api.methods.blogs.remove>
    ) => {
        setIsPending(true);
        try {
            await removeBlog(args);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to remove blog"
            );
        } finally {
            setIsPending(false);
        }
    };

    return { mutate, isPending };
};
