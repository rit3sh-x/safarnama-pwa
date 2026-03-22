import { PAGINATION } from "@/lib/constants"
import { api } from "@backend/api"
import { useMutation, usePaginatedQuery } from "convex/react"
import type { FunctionArgs } from "convex/server"
import { useState } from "react"
import { toast } from "sonner"
import { useSearchParams } from "./use-search-params"

export const useSendRequest = () => {
  const [isPending, setIsPending] = useState(false)
  const sendRequest = useMutation(api.methods.requests.userSendRequest)

  const mutate = async (
    args: FunctionArgs<typeof api.methods.requests.userSendRequest>
  ) => {
    setIsPending(true)
    try {
      await sendRequest(args)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send request")
    } finally {
      setIsPending(false)
    }
  }

  return { mutate, isPending }
}

export const useListRequests = (active = true) => {
  const { search } = useSearchParams()
  const { results, status, loadMore } = usePaginatedQuery(
    api.methods.requests.userListRequests,
    active ? { search: search?.trim() } : "skip",
    { initialNumItems: PAGINATION.INVITES_PAGE_SIZE }
  )

  return {
    invites: results,
    isLoading: status === "LoadingFirstPage",
    isDone: status === "Exhausted",
    loadMore: () => loadMore(PAGINATION.INVITES_PAGE_SIZE),
  }
}

export const useCancelRequest = () => {
  const [isPending, setIsPending] = useState(false)
  const cancelRequest = useMutation(api.methods.requests.userCancelRequest)

  const mutate = async (
    args: FunctionArgs<typeof api.methods.requests.userCancelRequest>
  ) => {
    setIsPending(true)
    try {
      await cancelRequest(args)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel request")
    } finally {
      setIsPending(false)
    }
  }

  return { mutate, isPending }
}

export const useReviewInvite = () => {
  const [isPending, setIsPending] = useState(false)
  const reviewInvite = useMutation(api.methods.requests.userReviewInvite)

  const mutate = async (
    args: FunctionArgs<typeof api.methods.requests.userReviewInvite>
  ) => {
    setIsPending(true)
    try {
      await reviewInvite(args)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to respond to invite")
    } finally {
      setIsPending(false)
    }
  }

  return { mutate, isPending }
}
