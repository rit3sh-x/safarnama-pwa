import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireUserAccess } from "../lib/utils";
import { getOrThrow } from "../lib/helpers";
import { notifyUser } from "../lib/notify";
import { rateLimit } from "../lib/rateLimit";
import { components } from "../_generated/api";
import { paginationOptsValidator } from "convex/server";
import type { Doc } from "../betterAuth/_generated/dataModel";

export const listParents = query({
    args: {
        blogId: v.id("blog"),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, { blogId, paginationOpts }) => {
        await requireUserAccess(ctx);
        const result = await ctx.db
            .query("blogComment")
            .withIndex("blogId", (q) => q.eq("blogId", blogId))
            .order("desc")
            .paginate(paginationOpts);

        const parents = result.page.filter((c) => !c.parentId);

        const authorIds = [...new Set(parents.map((c) => c.authorId))];

        const users: Doc<"user">[] = await ctx.runQuery(
            components.betterAuth.methods.users.getUsersByIds,
            { userIds: authorIds }
        );

        const authorMap = new Map(
            users.map((u) => [
                u.userId,
                { username: u.username, image: u.image },
            ])
        );

        const enriched = await Promise.all(
            parents.map(async (comment) => {
                const replies = await ctx.db
                    .query("blogComment")
                    .withIndex("parentId", (q) => q.eq("parentId", comment._id))
                    .collect();

                const author = authorMap.get(comment.authorId);
                return {
                    ...comment,
                    author: author ?? { username: "[anonymous]", image: null },
                    replyCount: replies.length,
                };
            })
        );

        return {
            ...result,
            page: enriched,
        };
    },
});

export const listReplies = query({
    args: { parentId: v.id("blogComment") },
    handler: async (ctx, { parentId }) => {
        await requireUserAccess(ctx);
        const replies = await ctx.db
            .query("blogComment")
            .withIndex("parentId", (q) => q.eq("parentId", parentId))
            .collect();

        replies.sort((a, b) => a._creationTime - b._creationTime);

        const authorIds = [...new Set(replies.map((c) => c.authorId))];

        const users: Doc<"user">[] = await ctx.runQuery(
            components.betterAuth.methods.users.getUsersByIds,
            { userIds: authorIds }
        );

        const authorMap = new Map(
            users.map((u) => [
                u.userId,
                { username: u.username, image: u.image },
            ])
        );

        return replies.map((comment) => {
            const author = authorMap.get(comment.authorId);
            return {
                ...comment,
                author: author ?? { username: "Anonymous", image: null },
            };
        });
    },
});

export const create = mutation({
    args: {
        blogId: v.id("blog"),
        content: v.string(),
        parentId: v.optional(v.id("blogComment")),
    },
    handler: async (ctx, { blogId, content, parentId }) => {
        const user = await requireUserAccess(ctx);
        await rateLimit(ctx, "createComment", user._id);

        if (parentId) {
            const parent = await ctx.db.get(parentId);
            if (!parent || parent.blogId !== blogId) {
                throw new ConvexError("Parent comment not found");
            }
        }

        await ctx.db.insert("blogComment", {
            blogId,
            authorId: user._id,
            content: content.trim(),
            parentId,
        });

        const blog = await ctx.db.get(blogId);
        if (blog) {
            const trip = await ctx.db.get(blog.tripId);
            if (trip && trip.createdBy !== user._id) {
                const preview =
                    content.length > 60 ? content.slice(0, 60) + "…" : content;
                await notifyUser(ctx, {
                    userId: trip.createdBy,
                    type: "comment",
                    tripId: blog.tripId,
                    referenceId: blogId,
                    title: blog.title,
                    body: `${user.name ?? "Someone"} commented: ${preview}`,
                    url: `/blogs/${blogId}`,
                });
            }
        }
    },
});

export const edit = mutation({
    args: {
        commentId: v.id("blogComment"),
        content: v.string(),
    },
    handler: async (ctx, { commentId, content }) => {
        const user = await requireUserAccess(ctx);
        await rateLimit(ctx, "editComment", user._id);

        const comment = await getOrThrow(ctx, commentId, "Comment");
        if (comment.authorId !== user._id)
            throw new ConvexError("Not authorized to edit this comment");

        await ctx.db.patch(commentId, {
            content: content.trim(),
            editedAt: Date.now(),
        });
    },
});

export const remove = mutation({
    args: { commentId: v.id("blogComment") },
    handler: async (ctx, { commentId }) => {
        const user = await requireUserAccess(ctx);
        const comment = await getOrThrow(ctx, commentId, "Comment");
        if (comment.authorId !== user._id)
            throw new ConvexError("Not authorized to delete this comment");

        await ctx.db.patch(commentId, { deletedAt: Date.now() });
    },
});
