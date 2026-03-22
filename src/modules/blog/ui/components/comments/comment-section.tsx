import { MessageSquareIcon } from "lucide-react"
import {
  useParentComments,
  useCreateComment,
  useEditComment,
  useDeleteComment,
} from "../../../hooks/use-comments"
import { InfiniteScrollTrigger } from "@/components/infinite-scroll-trigger"
import { CommentInput } from "./comment-input"
import { CommentThread } from "./comment-thread"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import type { CommentData } from "./comment-item"
import type { Id } from "@backend/dataModel"

interface CommentSectionProps {
  blogId: Id<"blog">
}

export function CommentSection({ blogId }: CommentSectionProps) {
  const { comments, isLoading, isDone, loadMore } = useParentComments(blogId)
  const { mutate: createComment, isPending: isCreatePending } =
    useCreateComment()
  const { mutate: editComment, isPending: isEditPending } = useEditComment()
  const { mutate: deleteComment } = useDeleteComment()

  const handleCreateTopLevel = async (content: string) => {
    await createComment({ blogId, content })
  }

  const handleCreateReply = async (
    blogId: Id<"blog">,
    content: string,
    parentId: Id<"blogComment">
  ) => {
    await createComment({ blogId, content, parentId })
  }

  const handleEdit = async (
    commentId: Id<"blogComment">,
    content: string
  ) => {
    await editComment({ commentId, content })
  }

  const handleDelete = async (commentId: Id<"blogComment">) => {
    await deleteComment({ commentId })
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-12 sm:px-6">
      <Separator className="mb-8" />

      <div className="mb-6 flex items-center gap-2">
        <MessageSquareIcon className="size-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Comments</h2>
      </div>

      {/* New comment input */}
      <CommentInput
        onSubmit={handleCreateTopLevel}
        isPending={isCreatePending}
      />

      {/* Loading */}
      {isLoading && (
        <div className="mt-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="size-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comments */}
      {!isLoading && comments.length > 0 && (
        <div className="mt-6 space-y-1">
          {comments.map((comment) => (
            <CommentThread
              key={comment._id}
              topComment={comment as CommentData}
              blogId={blogId}
              onCreateReply={handleCreateReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isCreatePending={isCreatePending}
              isEditPending={isEditPending}
            />
          ))}
        </div>
      )}

      {/* Load more */}
      {comments.length > 0 && (
        <InfiniteScrollTrigger
          canLoadMore={!isDone}
          isLoadingMore={!isLoading && !isDone}
          onLoadMore={loadMore}
          loadMoreText="Load more comments"
          noMoreText=""
          className="mt-4"
        />
      )}

      {/* Empty state */}
      {!isLoading && comments.length === 0 && (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          No comments yet. Be the first to share your thoughts!
        </p>
      )}
    </div>
  )
}
