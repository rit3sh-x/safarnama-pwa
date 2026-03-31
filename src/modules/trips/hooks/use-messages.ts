import { useCallback, useEffect, useRef } from "react";
import { useMutation, usePaginatedQuery } from "convex/react";
import type { OptimisticLocalStore } from "convex/browser";
import { api } from "@backend/api";
import type { FunctionArgs } from "convex/server";
import { useState } from "react";
import { PAGINATION } from "@/lib/constants";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import type { Id } from "@backend/dataModel";

function updateMessageInStore(
    localStore: OptimisticLocalStore,
    messageId: Id<"message">,
    updater: (msg: Record<string, unknown>) => Record<string, unknown>
) {
    const allPages = localStore.getAllQueries(api.methods.messages.list);
    for (const { args: queryArgs, value } of allPages) {
        if (!queryArgs || !value) continue;
        const page = value.page as Record<string, unknown>[];
        const idx = page.findIndex((m) => m._id === messageId);
        if (idx === -1) continue;
        const updated = [...page];
        updated[idx] = updater(updated[idx]);
        localStore.setQuery(api.methods.messages.list, queryArgs, {
            ...value,
            page: updated,
        } as typeof value);
        break;
    }
}

export function useMessages(tripId: Id<"trip"> | undefined) {
    const { results, status, loadMore } = usePaginatedQuery(
        api.methods.messages.list,
        tripId ? { tripId } : "skip",
        { initialNumItems: PAGINATION.MESSAGES_PAGE_SIZE }
    );

    return {
        messages: results ?? [],
        isLoading: status === "LoadingFirstPage",
        canLoadMore: status === "CanLoadMore",
        loadMore: () => loadMore(PAGINATION.MESSAGES_PAGE_SIZE),
    };
}

export const useSendMessage = () => {
    const [isPending, setIsPending] = useState(false);
    const send = useMutation(api.methods.messages.send).withOptimisticUpdate(
        (localStore, args) => {
            const currentUser = localStore.getQuery(
                api.methods.users.currentUser,
                {}
            );
            if (!currentUser) return;

            const allPages = localStore.getAllQueries(
                api.methods.messages.list
            );
            for (const { args: queryArgs, value } of allPages) {
                if (!queryArgs || !value || queryArgs.tripId !== args.tripId)
                    continue;

                const isPoll = !!(args.pollQuestion && args.pollOptions);
                const optimisticMessage = {
                    _id: nanoid(10) as Id<"message">,
                    _creationTime: Date.now(),
                    tripId: args.tripId,
                    senderId: currentUser._id,
                    type: isPoll ? ("poll" as const) : ("message" as const),
                    content: isPoll ? args.pollQuestion! : args.content,
                    replyToId: args.replyToId,
                    attachmentUrl: args.attachmentUrl,
                    attachmentType: args.attachmentType,
                    reactions: [],
                    sender: {
                        _id: currentUser._id,
                        name: currentUser.name,
                        image: currentUser.image ?? null,
                    },
                    poll: isPoll
                        ? {
                              _id: nanoid(10) as Id<"poll">,
                              question: args.pollQuestion!,
                              options: args.pollOptions!,
                              allowMultiple: args.pollAllowMultiple ?? false,
                              isAnonymous: args.pollIsAnonymous ?? false,
                              closedAt: undefined,
                              votes: [],
                              totalVotes: 0,
                              currentUserVotes: [],
                          }
                        : undefined,
                    _optimistic: true,
                };

                localStore.setQuery(api.methods.messages.list, queryArgs, {
                    ...value,
                    page: [optimisticMessage, ...value.page],
                });
                break;
            }
        }
    );

    const mutate = async (
        args: FunctionArgs<typeof api.methods.messages.send>
    ) => {
        setIsPending(true);
        try {
            await send(args);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to send message"
            );
        } finally {
            setIsPending(false);
        }
    };

    return { mutate, isPending };
};

export const useEditMessage = () => {
    const [isPending, setIsPending] = useState(false);
    const editMsg = useMutation(api.methods.messages.edit).withOptimisticUpdate(
        (localStore, args) => {
            updateMessageInStore(localStore, args.messageId, (msg) => ({
                ...msg,
                content: args.content,
                editedAt: Date.now(),
            }));
        }
    );

    const mutate = async (
        args: FunctionArgs<typeof api.methods.messages.edit>
    ) => {
        setIsPending(true);
        try {
            await editMsg(args);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to edit message"
            );
        } finally {
            setIsPending(false);
        }
    };

    return { mutate, isPending };
};

export const useDeleteMessage = () => {
    const [isPending, setIsPending] = useState(false);
    const removeMsg = useMutation(
        api.methods.messages.remove
    ).withOptimisticUpdate((localStore, args) => {
        updateMessageInStore(localStore, args.messageId, (msg) => ({
            ...msg,
            deletedAt: Date.now(),
            content: "[deleted]",
        }));
    });

    const mutate = async (
        args: FunctionArgs<typeof api.methods.messages.remove>
    ) => {
        setIsPending(true);
        try {
            await removeMsg(args);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to delete message"
            );
        } finally {
            setIsPending(false);
        }
    };

    return { mutate, isPending };
};

export const useAddReaction = () => {
    const [isPending, setIsPending] = useState(false);
    const addReaction = useMutation(
        api.methods.messages.addReaction
    ).withOptimisticUpdate((localStore, args) => {
        const currentUser = localStore.getQuery(
            api.methods.users.currentUser,
            {}
        );
        if (!currentUser) return;

        updateMessageInStore(localStore, args.messageId, (msg) => {
            const reactions = [
                ...((msg.reactions as {
                    emoji: string;
                    userIds: string[];
                    count: number;
                }[]) ?? []),
            ];
            const existing = reactions.find((r) => r.emoji === args.emoji);
            if (existing) {
                if (!existing.userIds.includes(currentUser._id)) {
                    existing.userIds = [...existing.userIds, currentUser._id];
                    existing.count++;
                }
            } else {
                reactions.push({
                    emoji: args.emoji,
                    userIds: [currentUser._id],
                    count: 1,
                });
            }
            return { ...msg, reactions };
        });
    });

    const mutate = async (
        args: FunctionArgs<typeof api.methods.messages.addReaction>
    ) => {
        setIsPending(true);
        try {
            await addReaction(args);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to add reaction"
            );
        } finally {
            setIsPending(false);
        }
    };

    return { mutate, isPending };
};

export const useRemoveReaction = () => {
    const [isPending, setIsPending] = useState(false);
    const removeReaction = useMutation(
        api.methods.messages.removeReaction
    ).withOptimisticUpdate((localStore, args) => {
        const currentUser = localStore.getQuery(
            api.methods.users.currentUser,
            {}
        );
        if (!currentUser) return;

        updateMessageInStore(localStore, args.messageId, (msg) => {
            const reactions = (
                (msg.reactions as {
                    emoji: string;
                    userIds: string[];
                    count: number;
                }[]) ?? []
            )
                .map((r) => {
                    if (r.emoji !== args.emoji) return r;
                    const userIds = r.userIds.filter(
                        (id) => id !== currentUser._id
                    );
                    return { ...r, userIds, count: userIds.length };
                })
                .filter((r) => r.count > 0);
            return { ...msg, reactions };
        });
    });

    const mutate = async (
        args: FunctionArgs<typeof api.methods.messages.removeReaction>
    ) => {
        setIsPending(true);
        try {
            await removeReaction(args);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to remove reaction"
            );
        } finally {
            setIsPending(false);
        }
    };

    return { mutate, isPending };
};

export const useVotePoll = () => {
    const [isPending, setIsPending] = useState(false);
    const votePoll = useMutation(
        api.methods.messages.votePoll
    ).withOptimisticUpdate((localStore, args) => {
        const currentUser = localStore.getQuery(
            api.methods.users.currentUser,
            {}
        );
        if (!currentUser) return;

        const allPages = localStore.getAllQueries(api.methods.messages.list);
        for (const { args: queryArgs, value } of allPages) {
            if (!queryArgs || !value) continue;
            const page = value.page as Record<string, unknown>[];
            const idx = page.findIndex(
                (m) =>
                    m.poll &&
                    (m.poll as Record<string, unknown>)._id === args.pollId
            );
            if (idx === -1) continue;
            const updated = [...page];
            const msg = { ...updated[idx] };
            const poll = {
                ...(msg.poll as Record<string, unknown>),
            };
            const votes = [
                ...((poll.votes as {
                    optionIndex: number;
                    userIds: string[];
                    count: number;
                }[]) ?? []),
            ];
            const currentUserVotes = [
                ...((poll.currentUserVotes as number[]) ?? []),
            ];
            const allowMultiple = poll.allowMultiple as boolean;

            const existingVoteIdx = currentUserVotes.indexOf(args.optionIndex);
            if (existingVoteIdx !== -1) {
                currentUserVotes.splice(existingVoteIdx, 1);
                const voteEntry = votes.find(
                    (v) => v.optionIndex === args.optionIndex
                );
                if (voteEntry) {
                    voteEntry.userIds = voteEntry.userIds.filter(
                        (id) => id !== currentUser._id
                    );
                    voteEntry.count = voteEntry.userIds.length;
                }
                poll.totalVotes = (poll.totalVotes as number) - 1;
            } else {
                if (!allowMultiple) {
                    for (const prevIdx of currentUserVotes) {
                        const prevEntry = votes.find(
                            (v) => v.optionIndex === prevIdx
                        );
                        if (prevEntry) {
                            prevEntry.userIds = prevEntry.userIds.filter(
                                (id) => id !== currentUser._id
                            );
                            prevEntry.count = prevEntry.userIds.length;
                            poll.totalVotes = (poll.totalVotes as number) - 1;
                        }
                    }
                    currentUserVotes.length = 0;
                }

                currentUserVotes.push(args.optionIndex);
                const voteEntry = votes.find(
                    (v) => v.optionIndex === args.optionIndex
                );
                if (voteEntry) {
                    voteEntry.userIds = [...voteEntry.userIds, currentUser._id];
                    voteEntry.count = voteEntry.userIds.length;
                } else {
                    votes.push({
                        optionIndex: args.optionIndex,
                        userIds: [currentUser._id],
                        count: 1,
                    });
                }
                poll.totalVotes = (poll.totalVotes as number) + 1;
            }

            poll.votes = votes.filter((v) => v.count > 0);
            poll.currentUserVotes = currentUserVotes;
            msg.poll = poll;
            updated[idx] = msg;
            localStore.setQuery(api.methods.messages.list, queryArgs, {
                ...value,
                page: updated,
            } as typeof value);
            break;
        }
    });

    const mutate = async (
        args: FunctionArgs<typeof api.methods.messages.votePoll>
    ) => {
        setIsPending(true);
        try {
            await votePoll(args);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to vote");
        } finally {
            setIsPending(false);
        }
    };

    return { mutate, isPending };
};

export const useClosePoll = () => {
    const [isPending, setIsPending] = useState(false);
    const closePoll = useMutation(
        api.methods.messages.closePoll
    ).withOptimisticUpdate((localStore, args) => {
        const allPages = localStore.getAllQueries(api.methods.messages.list);
        for (const { args: queryArgs, value } of allPages) {
            if (!queryArgs || !value) continue;
            const page = value.page as Record<string, unknown>[];
            const idx = page.findIndex(
                (m) =>
                    m.poll &&
                    (m.poll as Record<string, unknown>)._id === args.pollId
            );
            if (idx === -1) continue;
            const updated = [...page];
            const msg = { ...updated[idx] };
            msg.poll = {
                ...(msg.poll as Record<string, unknown>),
                closedAt: Date.now(),
            };
            updated[idx] = msg;
            localStore.setQuery(api.methods.messages.list, queryArgs, {
                ...value,
                page: updated,
            } as typeof value);
            break;
        }
    });

    const mutate = async (
        args: FunctionArgs<typeof api.methods.messages.closePoll>
    ) => {
        setIsPending(true);
        try {
            await closePoll(args);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to close poll"
            );
        } finally {
            setIsPending(false);
        }
    };

    return { mutate, isPending };
};

export const usePinMessage = () => {
    const [isPending, setIsPending] = useState(false);
    const pin = useMutation(api.methods.messages.pin).withOptimisticUpdate(
        (localStore, args) => {
            const currentUser = localStore.getQuery(
                api.methods.users.currentUser,
                {}
            );
            updateMessageInStore(localStore, args.messageId, (msg) => ({
                ...msg,
                pinnedAt: Date.now(),
                pinnedBy: currentUser?._id,
            }));
        }
    );

    const mutate = async (
        args: FunctionArgs<typeof api.methods.messages.pin>
    ) => {
        setIsPending(true);
        try {
            await pin(args);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to pin message"
            );
        } finally {
            setIsPending(false);
        }
    };

    return { mutate, isPending };
};

export const useUnpinMessage = () => {
    const [isPending, setIsPending] = useState(false);
    const unpin = useMutation(api.methods.messages.unpin).withOptimisticUpdate(
        (localStore, args) => {
            updateMessageInStore(localStore, args.messageId, (msg) => ({
                ...msg,
                pinnedAt: undefined,
                pinnedBy: undefined,
            }));
        }
    );

    const mutate = async (
        args: FunctionArgs<typeof api.methods.messages.unpin>
    ) => {
        setIsPending(true);
        try {
            await unpin(args);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to unpin message"
            );
        } finally {
            setIsPending(false);
        }
    };

    return { mutate, isPending };
};

export function useMarkRead(tripId: Id<"trip"> | undefined) {
    const markRead = useMutation(api.methods.messages.markRead);
    const lastMarkedRef = useRef(0);
    const tripIdRef = useRef<Id<"trip"> | undefined>(undefined);

    useEffect(() => {
        tripIdRef.current = tripId;
    }, [tripId]);

    useEffect(() => {
        if (!tripId) return;
        markRead({ tripId }).catch(() => {});
        lastMarkedRef.current = Date.now();
    }, [tripId, markRead]);

    const mark = useCallback(() => {
        const id = tripIdRef.current;
        if (!id) return;

        const now = Date.now();
        if (now - lastMarkedRef.current < 3000) return;

        lastMarkedRef.current = now;
        markRead({ tripId: id }).catch(() => {});
    }, [markRead]);

    return mark;
}

export function useUploadChatImage() {
    const [isUploading, setIsUploading] = useState(false);
    const generateUploadUrl = useMutation(api.methods.file.generateUploadUrl);
    const confirmUpload = useMutation(api.methods.file.confirmUpload);

    const upload = async (
        uri: string
    ): Promise<{ url: string | null } | null> => {
        setIsUploading(true);
        try {
            const response = await fetch(uri);
            const blob = await response.blob();

            const postUrl = await generateUploadUrl();
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": blob.type || "image/jpeg" },
                body: blob,
            });

            if (!result.ok) throw new Error("Upload failed");

            const { storageId } = await result.json();
            return await confirmUpload({ storageId });
        } catch (e) {
            console.error("Failed to upload image", e);
            return null;
        } finally {
            setIsUploading(false);
        }
    };

    return { upload, isUploading };
}
