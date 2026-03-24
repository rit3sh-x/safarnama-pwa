import { api } from "@backend/api";
import type { Id } from "@backend/dataModel";
import type { RatingValue } from "@backend/types";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache";
import type { FunctionArgs } from "convex/server";
import { useState } from "react";
import { toast } from "sonner";

const EMPTY_DISTRIBUTION: Record<RatingValue, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
};

export function useRating(blogId: Id<"blog">) {
    const data = useQuery(api.methods.ratings.getForBlog, { blogId });

    return {
        avgRating: data?.avgRating ?? 0,
        totalRatings: data?.totalRatings ?? 0,
        distribution: data?.distribution ?? EMPTY_DISTRIBUTION,
        userRating: data?.userRating ?? null,
        isLoading: data === undefined,
    };
}

export const useRateBlog = () => {
    const [isPending, setIsPending] = useState(false);
    const rateBlog = useMutation(api.methods.ratings.rate).withOptimisticUpdate(
        (localStore, args) => {
            const current = localStore.getQuery(
                api.methods.ratings.getForBlog,
                {
                    blogId: args.blogId,
                }
            );
            if (!current) return;

            const oldUserRating = current.userRating;
            const oldTotal = current.totalRatings;
            const oldSum = current.avgRating * oldTotal;

            const newDist = { ...current.distribution };
            if (oldUserRating !== null) {
                const old = oldUserRating as RatingValue;
                newDist[old] = Math.max(0, (newDist[old] ?? 0) - 1);
            }
            const next = args.rating as RatingValue;
            newDist[next] = (newDist[next] ?? 0) + 1;

            const newTotal = oldUserRating !== null ? oldTotal : oldTotal + 1;
            const newSum =
                oldUserRating !== null
                    ? oldSum - oldUserRating + args.rating
                    : oldSum + args.rating;

            localStore.setQuery(
                api.methods.ratings.getForBlog,
                { blogId: args.blogId },
                {
                    avgRating: Math.round((newSum / newTotal) * 10) / 10,
                    totalRatings: newTotal,
                    distribution: newDist,
                    userRating: args.rating,
                }
            );
        }
    );

    const mutate = async (
        args: FunctionArgs<typeof api.methods.ratings.rate>
    ) => {
        setIsPending(true);
        try {
            await rateBlog(args);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to rate blog"
            );
        } finally {
            setIsPending(false);
        }
    };

    return { mutate, isPending };
};
