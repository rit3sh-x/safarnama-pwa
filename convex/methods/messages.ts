import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireTripMember } from "../lib/utils";
import { paginationOptsValidator, type PaginationResult } from "convex/server";
import { components } from "../_generated/api";
import type { Doc } from "../betterAuth/_generated/dataModel";

export const list = query({
    args: {
        tripId: v.id("trip"),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, { tripId, paginationOpts }) => {
        const { user } = await requireTripMember(ctx, tripId);
        const result = await ctx.db
            .query("message")
            .withIndex("tripId", (q) => q.eq("tripId", tripId))
            .order("desc")
            .paginate(paginationOpts);

        const senderIds = [...new Set(result.page.map((m) => m.senderId))];
        let senderMap = new Map<string, Doc<"user">>();
        if (senderIds.length > 0) {
            const users: PaginationResult<Doc<"user">> = await ctx.runQuery(
                components.betterAuth.adapter.findMany,
                {
                    model: "user",
                    where: [
                        {
                            field: "_id",
                            value: senderIds,
                            operator: "in" as const,
                            connector: "AND" as const,
                        },
                    ],
                    paginationOpts: {
                        numItems: senderIds.length + 10,
                        cursor: null,
                    },
                }
            );
            senderMap = new Map(users.page.map((u) => [u._id, u]));
        }

        const page = await Promise.all(
            result.page.map(async (msg) => {
                const reactions = await ctx.db
                    .query("reaction")
                    .withIndex("messageId", (q) => q.eq("messageId", msg._id))
                    .collect();

                const grouped: Record<
                    string,
                    { emoji: string; userIds: string[]; count: number }
                > = {};
                for (const r of reactions) {
                    if (!grouped[r.emoji]) {
                        grouped[r.emoji] = {
                            emoji: r.emoji,
                            userIds: [],
                            count: 0,
                        };
                    }
                    grouped[r.emoji].userIds.push(r.userId);
                    grouped[r.emoji].count++;
                }

                const sender = senderMap.get(msg.senderId);

                let poll = undefined;
                if (msg.type === "poll" && msg.pollId) {
                    const pollDoc = await ctx.db.get(msg.pollId);
                    if (pollDoc) {
                        const votes = await ctx.db
                            .query("pollVote")
                            .withIndex("pollId", (q) =>
                                q.eq("pollId", pollDoc._id)
                            )
                            .collect();

                        const votesByOption: Record<
                            number,
                            {
                                optionIndex: number;
                                userIds: string[];
                                count: number;
                            }
                        > = {};
                        for (const vote of votes) {
                            if (!votesByOption[vote.optionIndex]) {
                                votesByOption[vote.optionIndex] = {
                                    optionIndex: vote.optionIndex,
                                    userIds: [],
                                    count: 0,
                                };
                            }
                            votesByOption[vote.optionIndex].userIds.push(
                                vote.userId
                            );
                            votesByOption[vote.optionIndex].count++;
                        }

                        const currentUserVotes = votes
                            .filter((v) => v.userId === user._id)
                            .map((v) => v.optionIndex);

                        poll = {
                            _id: pollDoc._id,
                            question: pollDoc.question,
                            options: pollDoc.options,
                            allowMultiple: pollDoc.allowMultiple,
                            isAnonymous: pollDoc.isAnonymous,
                            closedAt: pollDoc.closedAt,
                            votes: Object.values(votesByOption),
                            totalVotes: votes.length,
                            currentUserVotes,
                        };
                    }
                }

                return {
                    ...msg,
                    reactions: Object.values(grouped),
                    sender: {
                        _id: msg.senderId,
                        name: sender?.name ?? "Unknown",
                        image: sender?.image ?? null,
                    },
                    poll,
                };
            })
        );

        return { ...result, page };
    },
});

export const send = mutation({
    args: {
        tripId: v.id("trip"),
        content: v.string(),
        replyToId: v.optional(v.id("message")),
        attachmentUrl: v.optional(v.string()),
        attachmentType: v.optional(
            v.union(v.literal("image"), v.literal("file"))
        ),
        pollQuestion: v.optional(v.string()),
        pollOptions: v.optional(v.array(v.string())),
        pollAllowMultiple: v.optional(v.boolean()),
        pollIsAnonymous: v.optional(v.boolean()),
    },
    handler: async (
        ctx,
        {
            tripId,
            pollQuestion,
            pollOptions,
            pollAllowMultiple,
            pollIsAnonymous,
            ...rest
        }
    ) => {
        const { user } = await requireTripMember(ctx, tripId);

        if (pollQuestion && pollOptions && pollOptions.length >= 2) {
            const messageId = await ctx.db.insert("message", {
                tripId,
                senderId: user._id,
                type: "poll",
                content: pollQuestion,
            });
            const pollId = await ctx.db.insert("poll", {
                messageId,
                tripId,
                createdBy: user._id,
                question: pollQuestion,
                options: pollOptions,
                allowMultiple: pollAllowMultiple ?? false,
                isAnonymous: pollIsAnonymous ?? false,
            });
            await ctx.db.patch(messageId, { pollId });
            return messageId;
        }

        return ctx.db.insert("message", {
            tripId,
            senderId: user._id,
            type: "message",
            ...rest,
        });
    },
});

export const edit = mutation({
    args: {
        messageId: v.id("message"),
        content: v.string(),
    },
    handler: async (ctx, { messageId, content }) => {
        const msg = await ctx.db.get(messageId);
        if (!msg || msg.type !== "message")
            throw new ConvexError({
                code: "NOT_FOUND",
                message: "Message not found",
            });
        if (msg.deletedAt)
            throw new ConvexError({
                code: "BAD_REQUEST",
                message: "Message deleted",
            });

        const { user } = await requireTripMember(ctx, msg.tripId);
        if (msg.senderId !== user._id)
            throw new ConvexError({
                code: "FORBIDDEN",
                message: "Not your message",
            });

        await ctx.db.patch(messageId, { content, editedAt: Date.now() });
    },
});

export const remove = mutation({
    args: { messageId: v.id("message") },
    handler: async (ctx, { messageId }) => {
        const msg = await ctx.db.get(messageId);
        if (!msg)
            throw new ConvexError({
                code: "NOT_FOUND",
                message: "Message not found",
            });

        const { user, member } = await requireTripMember(ctx, msg.tripId);
        if (msg.senderId !== user._id && member.role !== "owner")
            throw new ConvexError({
                code: "FORBIDDEN",
                message: "Unauthorized",
            });

        await ctx.db.patch(messageId, {
            deletedAt: Date.now(),
            content: "[deleted]",
        });
    },
});

export const addReaction = mutation({
    args: {
        messageId: v.id("message"),
        emoji: v.string(),
    },
    handler: async (ctx, { messageId, emoji }) => {
        const msg = await ctx.db.get(messageId);
        if (!msg)
            throw new ConvexError({
                code: "NOT_FOUND",
                message: "Message not found",
            });
        if (msg.deletedAt)
            throw new ConvexError({
                code: "BAD_REQUEST",
                message: "Message deleted",
            });

        const { user } = await requireTripMember(ctx, msg.tripId);

        const existing = await ctx.db
            .query("reaction")
            .withIndex("messageId_userId_emoji", (q) =>
                q
                    .eq("messageId", messageId)
                    .eq("userId", user._id)
                    .eq("emoji", emoji)
            )
            .unique();

        if (existing) return existing._id;

        return ctx.db.insert("reaction", {
            messageId,
            tripId: msg.tripId,
            userId: user._id,
            emoji,
        });
    },
});

export const removeReaction = mutation({
    args: {
        messageId: v.id("message"),
        emoji: v.string(),
    },
    handler: async (ctx, { messageId, emoji }) => {
        const msg = await ctx.db.get(messageId);
        if (!msg)
            throw new ConvexError({
                code: "NOT_FOUND",
                message: "Message not found",
            });

        const { user } = await requireTripMember(ctx, msg.tripId);

        const existing = await ctx.db
            .query("reaction")
            .withIndex("messageId_userId_emoji", (q) =>
                q
                    .eq("messageId", messageId)
                    .eq("userId", user._id)
                    .eq("emoji", emoji)
            )
            .unique();

        if (!existing)
            throw new ConvexError({
                code: "NOT_FOUND",
                message: "Reaction not found",
            });
        await ctx.db.delete(existing._id);
    },
});

export const getReactions = query({
    args: { messageId: v.id("message") },
    handler: async (ctx, { messageId }) => {
        const msg = await ctx.db.get(messageId);
        if (!msg)
            throw new ConvexError({
                code: "NOT_FOUND",
                message: "Message not found",
            });
        await requireTripMember(ctx, msg.tripId);

        const reactions = await ctx.db
            .query("reaction")
            .withIndex("messageId", (q) => q.eq("messageId", messageId))
            .collect();

        const grouped: Record<
            string,
            { emoji: string; userIds: string[]; count: number }
        > = {};
        for (const r of reactions) {
            if (!grouped[r.emoji]) {
                grouped[r.emoji] = { emoji: r.emoji, userIds: [], count: 0 };
            }
            grouped[r.emoji].userIds.push(r.userId);
            grouped[r.emoji].count++;
        }

        return Object.values(grouped);
    },
});

export const pin = mutation({
    args: { messageId: v.id("message") },
    handler: async (ctx, { messageId }) => {
        const msg = await ctx.db.get(messageId);
        if (!msg)
            throw new ConvexError({
                code: "NOT_FOUND",
                message: "Message not found",
            });
        if (msg.deletedAt)
            throw new ConvexError({
                code: "BAD_REQUEST",
                message: "Message deleted",
            });

        const { user, member } = await requireTripMember(ctx, msg.tripId);
        if (member.role !== "owner")
            throw new ConvexError({
                code: "FORBIDDEN",
                message: "Only admins can pin messages",
            });

        await ctx.db.patch(messageId, {
            pinnedAt: Date.now(),
            pinnedBy: user._id,
        });
    },
});

export const unpin = mutation({
    args: { messageId: v.id("message") },
    handler: async (ctx, { messageId }) => {
        const msg = await ctx.db.get(messageId);
        if (!msg)
            throw new ConvexError({
                code: "NOT_FOUND",
                message: "Message not found",
            });

        const { member } = await requireTripMember(ctx, msg.tripId);
        if (member.role !== "owner")
            throw new ConvexError({
                code: "FORBIDDEN",
                message: "Only admins can unpin messages",
            });

        await ctx.db.patch(messageId, {
            pinnedAt: undefined,
            pinnedBy: undefined,
        });
    },
});

export const listPinned = query({
    args: { tripId: v.id("trip") },
    handler: async (ctx, { tripId }) => {
        await requireTripMember(ctx, tripId);

        const messages = await ctx.db
            .query("message")
            .withIndex("tripId", (q) => q.eq("tripId", tripId))
            .collect();

        return messages.filter((m) => m.pinnedAt && !m.deletedAt);
    },
});

export const votePoll = mutation({
    args: {
        pollId: v.id("poll"),
        optionIndex: v.number(),
    },
    handler: async (ctx, { pollId, optionIndex }) => {
        const poll = await ctx.db.get(pollId);
        if (!poll)
            throw new ConvexError({
                code: "NOT_FOUND",
                message: "Poll not found",
            });
        if (poll.closedAt)
            throw new ConvexError({
                code: "BAD_REQUEST",
                message: "Poll is closed",
            });
        if (optionIndex < 0 || optionIndex >= poll.options.length)
            throw new ConvexError({
                code: "BAD_REQUEST",
                message: "Invalid option index",
            });

        const { user } = await requireTripMember(ctx, poll.tripId);

        const userVotes = await ctx.db
            .query("pollVote")
            .withIndex("pollId_userId", (q) =>
                q.eq("pollId", pollId).eq("userId", user._id)
            )
            .collect();

        const existingForOption = userVotes.find(
            (v) => v.optionIndex === optionIndex
        );
        if (existingForOption) {
            await ctx.db.delete(existingForOption._id);
            return;
        }

        if (!poll.allowMultiple) {
            for (const vote of userVotes) {
                await ctx.db.delete(vote._id);
            }
        }

        await ctx.db.insert("pollVote", {
            pollId,
            tripId: poll.tripId,
            userId: user._id,
            optionIndex,
        });
    },
});

export const closePoll = mutation({
    args: { pollId: v.id("poll") },
    handler: async (ctx, { pollId }) => {
        const poll = await ctx.db.get(pollId);
        if (!poll)
            throw new ConvexError({
                code: "NOT_FOUND",
                message: "Poll not found",
            });

        const { user, member } = await requireTripMember(ctx, poll.tripId);
        if (poll.createdBy !== user._id && member.role !== "owner")
            throw new ConvexError({
                code: "FORBIDDEN",
                message: "Only the creator or admin can close a poll",
            });

        await ctx.db.patch(pollId, { closedAt: Date.now() });
    },
});

export const markRead = mutation({
    args: { tripId: v.id("trip") },
    handler: async (ctx, { tripId }) => {
        const { user } = await requireTripMember(ctx, tripId);
        const now = Date.now();

        const existing = await ctx.db
            .query("messageReadCursor")
            .withIndex("tripId_userId", (q) =>
                q.eq("tripId", tripId).eq("userId", user._id)
            )
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, { lastReadTime: now });
        } else {
            await ctx.db.insert("messageReadCursor", {
                tripId,
                userId: user._id,
                lastReadTime: now,
            });
        }
    },
});
