import { PAGINATION } from "@/lib/constants"
import { api } from "@backend/api"
import type { Id } from "@backend/dataModel"
import { useMutation, usePaginatedQuery } from "convex/react"
import { useQuery } from "convex-helpers/react/cache"
import type { FunctionArgs } from "convex/server"
import { useState } from "react"
import { toast } from "sonner"

export function useParentComments(blogId: Id<"blog">) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.methods.comments.listParents,
    { blogId },
    { initialNumItems: PAGINATION.COMMENTS_PAGE_SIZE }
  )

  return {
    comments: results,
    isLoading: status === "LoadingFirstPage",
    isDone: status === "Exhausted",
    loadMore: () => loadMore(PAGINATION.COMMENTS_PAGE_SIZE),
  }
}

export function useReplies(parentId: Id<"blogComment"> | undefined) {
  const data = useQuery(
    api.methods.comments.listReplies,
    parentId ? { parentId } : "skip"
  )

  return {
    replies: data ?? [],
    isLoading: data === undefined && parentId !== undefined,
  }
}

export const useCreateComment = () => {
  const [isPending, setIsPending] = useState(false)
  const create = useMutation(api.methods.comments.create)

  const mutate = async (
    args: FunctionArgs<typeof api.methods.comments.create>
  ) => {
    setIsPending(true)
    try {
      await create(args)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post comment")

    } finally {
      setIsPending(false)
    }
  }

  return { mutate, isPending }
}

export const useEditComment = () => {
  const [isPending, setIsPending] = useState(false)
  const edit = useMutation(api.methods.comments.edit)

  const mutate = async (
    args: FunctionArgs<typeof api.methods.comments.edit>
  ) => {
    setIsPending(true)
    try {
      await edit(args)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to edit comment")

    } finally {
      setIsPending(false)
    }
  }

  return { mutate, isPending }
}

export const useDeleteComment = () => {
  const [isPending, setIsPending] = useState(false)
  const remove = useMutation(api.methods.comments.remove)

  const mutate = async (
    args: FunctionArgs<typeof api.methods.comments.remove>
  ) => {
    setIsPending(true)
    try {
      await remove(args)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete comment")

    } finally {
      setIsPending(false)
    }
  }

  return { mutate, isPending }
}
