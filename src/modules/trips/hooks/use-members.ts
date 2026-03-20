import { PAGINATION } from "@/lib/constants"
import { api } from "@backend/api"
import { useMutation, usePaginatedQuery } from "convex/react"
import type { FunctionArgs } from "convex/server"
import { useState } from "react"
import type { Id } from "@backend/dataModel"
import { useSearchParams } from "./use-search-params"

export function useMembers(tripId: Id<"trip"> | undefined, active = true) {
  const { search } = useSearchParams()
  const listMembersQuery = api.methods.members.list as unknown as Parameters<
    typeof usePaginatedQuery
  >[0]
  const { results, status, loadMore } = usePaginatedQuery(
    listMembersQuery,
    active && tripId ? { tripId, search: search?.trim() || undefined } : "skip",
    { initialNumItems: PAGINATION.MEMBERS_PAGE_SIZE }
  )

  return {
    members: results,
    isLoading: status === "LoadingFirstPage",
    isDone: status === "Exhausted",
    loadMore: () => loadMore(PAGINATION.MEMBERS_PAGE_SIZE),
  }
}

export const useRemoveMember = () => {
  const [isPending, setIsPending] = useState(false)
  const removeMember = useMutation(api.methods.members.remove)

  const mutate = async (
    args: FunctionArgs<typeof api.methods.members.remove>
  ) => {
    setIsPending(true)
    try {
      await removeMember(args)
    } catch {
      console.error("Failed to remove member")
    } finally {
      setIsPending(false)
    }
  }

  return { mutate, isPending }
}

export const useLeaveTrip = () => {
  const [isPending, setIsPending] = useState(false)
  const leaveTrip = useMutation(api.methods.members.leave)

  const mutate = async (
    args: FunctionArgs<typeof api.methods.members.leave>
  ) => {
    setIsPending(true)
    try {
      await leaveTrip(args)
    } catch {
      console.error("Failed to leave trip")
    } finally {
      setIsPending(false)
    }
  }

  return { mutate, isPending }
}

export const useChangeMemberRole = () => {
  const [isPending, setIsPending] = useState(false)
  const changeMemberRole = useMutation(api.methods.members.changeRole)

  const mutate = async (
    args: FunctionArgs<typeof api.methods.members.changeRole>
  ) => {
    setIsPending(true)
    try {
      await changeMemberRole(args)
    } catch {
      console.error("Failed to change member role")
    } finally {
      setIsPending(false)
    }
  }

  return { mutate, isPending }
}
