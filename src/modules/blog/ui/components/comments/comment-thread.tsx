import { useState } from "react"
import { ChevronDownIcon, ChevronUpIcon, Loader2Icon } from "lucide-react"
import { useReplies } from "../../../hooks/use-comments"
import { CommentItem, type CommentData } from "./comment-item"
import { CommentInput } from "./comment-input"
import { Button } from "@/components/ui/button"
import type { Id } from "@backend/dataModel"

interface CommentThreadProps {
  topComment: CommentData
  blogId: Id<"blog">
  onCreateReply: (
    blogId: Id<"blog">,
    content: string,
    parentId: Id<"blogComment">
  ) => Promise<void>
  onEdit: (commentId: Id<"blogComment">, content: string) => Promise<void>
  onDelete: (commentId: Id<"blogComment">) => Promise<void>
  isCreatePending?: boolean
  isEditPending?: boolean
}

export function CommentThread({
  topComment,
  blogId,
  onCreateReply,
  onEdit,
  onDelete,
  isCreatePending,
  isEditPending,
}: CommentThreadProps) {
  const [expanded, setExpanded] = useState(false)
  const [replyingTo, setReplyingTo] = useState<CommentData | null>(null)

  const replyCount = topComment.replyCount ?? 0

  // Only fetch replies when expanded
  const { replies, isLoading: repliesLoading } = useReplies(
    expanded ? topComment._id : undefined
  )

  const handleReply = (comment: CommentData) => {
    if (!expanded && replyCount > 0) setExpanded(true)
    setReplyingTo(comment)
  }

  const handleSubmitReply = async (content: string) => {
    await onCreateReply(blogId, content, topComment._id)
    setReplyingTo(null)
    if (!expanded) setExpanded(true)
  }

  // When replying to a reply, prepend @username (YouTube behavior)
  const replyInitialValue =
    replyingTo && replyingTo._id !== topComment._id
      ? `@${replyingTo.author.username} `
      : ""

  return (
    <div>
      <CommentItem
        comment={topComment}
        onReply={handleReply}
        onEdit={onEdit}
        onDelete={onDelete}
        isEditPending={isEditPending}
      />

      {/* View replies toggle */}
      {replyCount > 0 && (
        <div className="ml-11">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 px-2 text-xs font-medium text-primary"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronUpIcon className="size-3.5" />
            ) : (
              <ChevronDownIcon className="size-3.5" />
            )}
            {expanded
              ? "Hide replies"
              : `View ${replyCount} ${replyCount === 1 ? "reply" : "replies"}`}
          </Button>
        </div>
      )}

      {/* Replies — indented, lazy loaded */}
      {expanded && (
        <div className="ml-11 border-l border-border pl-4">
          {repliesLoading && (
            <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
              <Loader2Icon className="size-3.5 animate-spin" />
              Loading replies...
            </div>
          )}
          {replies.map((reply) => (
            <CommentItem
              key={reply._id}
              comment={reply as CommentData}
              onReply={handleReply}
              onEdit={onEdit}
              onDelete={onDelete}
              isEditPending={isEditPending}
            />
          ))}
        </div>
      )}

      {/* Inline reply input */}
      {replyingTo && (
        <div className="ml-11 mt-1 pl-4">
          <CommentInput
            autoFocus
            initialValue={replyInitialValue}
            placeholder={`Reply to @${replyingTo.author.username}...`}
            isPending={isCreatePending}
            onSubmit={handleSubmitReply}
            onCancel={() => setReplyingTo(null)}
          />
        </div>
      )}
    </div>
  )
}
