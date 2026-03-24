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

export function useBrowseBlogs(search?: string) {
    const { results, status, loadMore } = usePaginatedQuery(
        api.methods.blogs.browse,
        { search: search?.trim() || undefined },
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
            status: args.status,
            publishedAt:
                args.status === "published"
                    ? (currentTripBlog?.publishedAt ?? now)
                    : undefined,
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
                    avgRating: existing?.avgRating ?? 0,
                    totalRatings: existing?.totalRatings ?? 0,
                    distribution:
                        existing?.distribution ??
                        ({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<
                            RatingValue,
                            number
                        >),
                    userRating: existing?.userRating ?? null,
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
    const removeBlog = useMutation(api.methods.blogs.remove);

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
