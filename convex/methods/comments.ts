import { ConvexError, v } from "convex/values"
import { mutation, query } from "../_generated/server"
import { requireUserAccess } from "../lib/utils"
import { components } from "../_generated/api"
import { paginationOptsValidator } from "convex/server"
import type { Doc } from "../betterAuth/_generated/dataModel"

export const listParents = query({
  args: {
    blogId: v.id("blog"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { blogId, paginationOpts }) => {
    await requireUserAccess(ctx)
    const result = await ctx.db
      .query("blogComment")
      .withIndex("blogId", (q) => q.eq("blogId", blogId))
      .order("desc")
      .paginate(paginationOpts)

    const parents = result.page.filter((c) => !c.parentId)

    const authorIds = [...new Set(parents.map((c) => c.authorId))]

    const users: Doc<"user">[] = await ctx.runQuery(
      components.betterAuth.methods.users.getUsersByIds,
      { userIds: authorIds }
    )

    const authorMap = new Map(
      users.map((u) => [
        u.userId,
        { username: u.username, image: u.image },
      ])
    )

    const enriched = await Promise.all(
      parents.map(async (comment) => {
        const replies = await ctx.db
          .query("blogComment")
          .withIndex("parentId", (q) => q.eq("parentId", comment._id))
          .collect()

        const author = authorMap.get(comment.authorId)
        return {
          ...comment,
          author: author ?? { username: "[anonymous]", image: null },
          replyCount: replies.length,
        }
      })
    )

    return {
      ...result,
      page: enriched,
    }
  },
})

export const listReplies = query({
  args: { parentId: v.id("blogComment") },
  handler: async (ctx, { parentId }) => {
    await requireUserAccess(ctx)
    const replies = await ctx.db
      .query("blogComment")
      .withIndex("parentId", (q) => q.eq("parentId", parentId))
      .collect()

    replies.sort((a, b) => a._creationTime - b._creationTime)

    const authorIds = [...new Set(replies.map((c) => c.authorId))]

    const users: Doc<"user">[] = await ctx.runQuery(
      components.betterAuth.methods.users.getUsersByIds,
      { userIds: authorIds }
    )

    const authorMap = new Map(
      users.map((u) => [
        u.userId,
        { username: u.username, image: u.image },
      ])
    )

    return replies.map((comment) => {
      const author = authorMap.get(comment.authorId)
      return {
        ...comment,
        author: author ?? { username: "Anonymous", image: null },
      }
    })
  },
})

export const create = mutation({
  args: {
    blogId: v.id("blog"),
    content: v.string(),
    parentId: v.optional(v.id("blogComment")),
  },
  handler: async (ctx, { blogId, content, parentId }) => {
    const user = await requireUserAccess(ctx)

    if (parentId) {
      const parent = await ctx.db.get(parentId)
      if (!parent || parent.blogId !== blogId) {
        throw new ConvexError("Parent comment not found")
      }
    }

    await ctx.db.insert("blogComment", {
      blogId,
      authorId: user._id,
      content: content.trim(),
      parentId,
    })
  },
})

export const edit = mutation({
  args: {
    commentId: v.id("blogComment"),
    content: v.string(),
  },
  handler: async (ctx, { commentId, content }) => {
    const user = await requireUserAccess(ctx)
    const comment = await ctx.db.get(commentId)

    if (!comment) throw new ConvexError("Comment not found")
    if (comment.authorId !== user._id)
      throw new ConvexError("Not authorized to edit this comment")

    await ctx.db.patch(commentId, {
      content: content.trim(),
      editedAt: Date.now(),
    })
  },
})

export const remove = mutation({
  args: { commentId: v.id("blogComment") },
  handler: async (ctx, { commentId }) => {
    const user = await requireUserAccess(ctx)
    const comment = await ctx.db.get(commentId)

    if (!comment) throw new ConvexError("Comment not found")
    if (comment.authorId !== user._id)
      throw new ConvexError("Not authorized to delete this comment")

    await ctx.db.patch(commentId, { deletedAt: Date.now() })
  },
})
