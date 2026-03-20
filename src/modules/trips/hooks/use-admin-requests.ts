import { PAGINATION } from "@/lib/constants"
import { api } from "@backend/api"
import { useMutation, usePaginatedQuery } from "convex/react"
import type { FunctionArgs } from "convex/server"
import { useState } from "react"
import { useSearchParams } from "./use-search-params"

export const useSendInvite = () => {
  const [isPending, setIsPending] = useState(false)
  const sendInvite = useMutation(api.methods.requests.adminSendInvite)

  const mutate = async (
    args: FunctionArgs<typeof api.methods.requests.adminSendInvite>
  ) => {
    setIsPending(true)
    try {
      return await sendInvite(args)
    } catch {
      console.error("Failed to send invite")
    } finally {
      setIsPending(false)
    }
  }

  return { mutate, isPending }
}

export const useAdminListRequests = ({
  orgId,
}: Pick<
  FunctionArgs<typeof api.methods.requests.adminListRequests>,
  "orgId"
>) => {
  const { search } = useSearchParams()
  const { results, status, loadMore } = usePaginatedQuery(
    api.methods.requests.adminListRequests,
    { orgId, search: search?.trim() },
    { initialNumItems: PAGINATION.INVITES_PAGE_SIZE }
  )

  return {
    requests: results,
    isLoading: status === "LoadingFirstPage",
    isDone: status === "Exhausted",
    loadMore: () => loadMore(PAGINATION.INVITES_PAGE_SIZE),
  }
}

export const useCancelInvite = () => {
  const [isPending, setIsPending] = useState(false)
  const cancelInvite = useMutation(api.methods.requests.adminCancelInvite)

  const mutate = async (
    args: FunctionArgs<typeof api.methods.requests.adminCancelInvite>
  ) => {
    setIsPending(true)
    try {
      await cancelInvite(args)
    } catch {
      console.error("Failed to cancel invite")
    } finally {
      setIsPending(false)
    }
  }

  return { mutate, isPending }
}

export const useReviewRequest = () => {
  const [isPending, setIsPending] = useState(false)
  const reviewRequest = useMutation(api.methods.requests.adminReviewRequest)

  const mutate = async (
    args: FunctionArgs<typeof api.methods.requests.adminReviewRequest>
  ) => {
    setIsPending(true)
    try {
      await reviewRequest(args)
    } catch {
      console.error("Failed to review request")
    } finally {
      setIsPending(false)
    }
  }

  return { mutate, isPending }
}
