import { PAGINATION } from "@/lib/constants";
import { api } from "@backend/api";
import type { Id } from "@backend/dataModel";
import type { OptimisticLocalStore } from "convex/browser";
import { useMutation, usePaginatedQuery } from "convex/react";
import { useQuery } from "convex-helpers/react/cache";
import type { FunctionArgs } from "convex/server";
import { nanoid } from "nanoid";
import { useState } from "react";
import { toast } from "sonner";

function updateParentCommentInStore(
    localStore: OptimisticLocalStore,
    commentId: Id<"blogComment">,
    updater: (c: Record<string, unknown>) => Record<string, unknown>
) {
    const allPages = localStore.getAllQueries(api.methods.comments.listParents);
    for (const { args: queryArgs, value } of allPages) {
        if (!queryArgs || !value) continue;
        const page = value.page as Record<string, unknown>[];
        const idx = page.findIndex((c) => c._id === commentId);
        if (idx === -1) continue;
        const updated = [...page];
        updated[idx] = updater(updated[idx]);
        localStore.setQuery(api.methods.comments.listParents, queryArgs, {
            ...value,
            page: updated,
        } as typeof value);
        return true;
    }
    return false;
}

function updateReplyInStore(
    localStore: OptimisticLocalStore,
    commentId: Id<"blogComment">,
    updater: (c: Record<string, unknown>) => Record<string, unknown>
) {
    const allReplies = localStore.getAllQueries(
        api.methods.comments.listReplies
    );
    for (const { args: queryArgs, value } of allReplies) {
        if (!queryArgs || !value) continue;
        const replies = value as Record<string, unknown>[];
        const idx = replies.findIndex((c) => c._id === commentId);
        if (idx === -1) continue;
        const updated = [...replies];
        updated[idx] = updater(updated[idx]);
        localStore.setQuery(
            api.methods.comments.listReplies,
            queryArgs,
            updated as typeof value
        );
        return true;
    }
    return false;
}

export function useParentComments(blogId: Id<"blog">) {
    const { results, status, loadMore } = usePaginatedQuery(
        api.methods.comments.listParents,
        { blogId },
        { initialNumItems: PAGINATION.COMMENTS_PAGE_SIZE }
    );

    return {
        comments: results,
        isLoading: status === "LoadingFirstPage",
        isDone: status === "Exhausted",
        loadMore: () => loadMore(PAGINATION.COMMENTS_PAGE_SIZE),
    };
}

export function useReplies(parentId: Id<"blogComment"> | undefined) {
    const data = useQuery(
        api.methods.comments.listReplies,
        parentId ? { parentId } : "skip"
    );

    return {
        replies: data ?? [],
        isLoading: data === undefined && parentId !== undefined,
    };
}

export const useCreateComment = () => {
    const [isPending, setIsPending] = useState(false);
    const create = useMutation(
        api.methods.comments.create
    ).withOptimisticUpdate((localStore, args) => {
        const currentUser = localStore.getQuery(
            api.methods.users.currentUser,
            {}
        );
        if (!currentUser) return;

        const optimisticComment = {
            _id: nanoid(10) as Id<"blogComment">,
            _creationTime: Date.now(),
            blogId: args.blogId,
            authorId: currentUser._id,
            content: args.content,
            parentId: args.parentId,
            author: {
                username: currentUser.name ?? "You",
                image: currentUser.image ?? null,
            },
            replyCount: 0,
            _optimistic: true,
        };

        if (args.parentId) {
            const allReplies = localStore.getAllQueries(
                api.methods.comments.listReplies
            );
            for (const { args: queryArgs, value } of allReplies) {
                if (
                    !queryArgs ||
                    !value ||
                    queryArgs.parentId !== args.parentId
                )
                    continue;
                const replies = value as Record<string, unknown>[];
                localStore.setQuery(
                    api.methods.comments.listReplies,
                    queryArgs,
                    [...replies, optimisticComment] as typeof value
                );
                break;
            }
            updateParentCommentInStore(localStore, args.parentId, (c) => ({
                ...c,
                replyCount: ((c.replyCount as number) ?? 0) + 1,
            }));
        } else {
            const allPages = localStore.getAllQueries(
                api.methods.comments.listParents
            );
            for (const { args: queryArgs, value } of allPages) {
                if (!queryArgs || !value || queryArgs.blogId !== args.blogId)
                    continue;
                localStore.setQuery(
                    api.methods.comments.listParents,
                    queryArgs,
                    {
                        ...value,
                        page: [optimisticComment, ...value.page],
                    }
                );
                break;
            }
        }
    });

    const mutate = async (
        args: FunctionArgs<typeof api.methods.comments.create>
    ) => {
        setIsPending(true);
        try {
            await create(args);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to post comment"
            );
        } finally {
            setIsPending(false);
        }
    };

    return { mutate, isPending };
};

export const useEditComment = () => {
    const [isPending, setIsPending] = useState(false);
    const edit = useMutation(api.methods.comments.edit).withOptimisticUpdate(
        (localStore, args) => {
            const updater = (c: Record<string, unknown>) => ({
                ...c,
                content: args.content,
                editedAt: Date.now(),
            });
            if (
                !updateParentCommentInStore(localStore, args.commentId, updater)
            ) {
                updateReplyInStore(localStore, args.commentId, updater);
            }
        }
    );

    const mutate = async (
        args: FunctionArgs<typeof api.methods.comments.edit>
    ) => {
        setIsPending(true);
        try {
            await edit(args);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to edit comment"
            );
        } finally {
            setIsPending(false);
        }
    };

    return { mutate, isPending };
};

export const useDeleteComment = () => {
    const [isPending, setIsPending] = useState(false);
    const remove = useMutation(
        api.methods.comments.remove
    ).withOptimisticUpdate((localStore, args) => {
        const updater = (c: Record<string, unknown>) => ({
            ...c,
            deletedAt: Date.now(),
            content: "[deleted]",
        });
        if (!updateParentCommentInStore(localStore, args.commentId, updater)) {
            updateReplyInStore(localStore, args.commentId, updater);
        }
    });

    const mutate = async (
        args: FunctionArgs<typeof api.methods.comments.remove>
    ) => {
        setIsPending(true);
        try {
            await remove(args);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to delete comment"
            );
        } finally {
            setIsPending(false);
        }
    };

    return { mutate, isPending };
};
