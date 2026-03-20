import { PAGINATION } from "@/lib/constants"
import { api } from "@backend/api"
import { useMutation, usePaginatedQuery, useQuery } from "convex/react"
import type { FunctionArgs } from "convex/server"
import { useState } from "react"
import { useSearchParams } from "./use-search-params"
import type { Id } from "@backend/dataModel"

export function useTrips(active = true) {
  const { search } = useSearchParams()
  const { results, status, loadMore } = usePaginatedQuery(
    api.methods.trips.list,
    active ? { search: search?.trim() || undefined } : "skip",
    { initialNumItems: PAGINATION.TRIPS_PAGE_SIZE }
  )

  return {
    trips: results,
    isLoading: status === "LoadingFirstPage",
    isDone: status === "Exhausted",
    loadMore: () => loadMore(PAGINATION.TRIPS_PAGE_SIZE),
  }
}

export const useTripDetails = (tripId: Id<"trip">) => {
  return useQuery(api.methods.trips.get, {
    tripId,
  })
}

export function usePublicTrips(active = true) {
  const { search } = useSearchParams()
  const { results, status, loadMore } = usePaginatedQuery(
    api.methods.trips.listPublic,
    active ? { search: search?.trim() || undefined } : "skip",
    { initialNumItems: PAGINATION.TRIPS_PAGE_SIZE }
  )

  return {
    trips: results,
    isLoading: status === "LoadingFirstPage",
    isDone: status === "Exhausted",
    loadMore: () => loadMore(PAGINATION.TRIPS_PAGE_SIZE),
  }
}

export const useCreateTrip = () => {
  const [isPending, setIsPending] = useState(false)
  const createTripMutation = useMutation(api.methods.trips.create)

  const mutate = async (
    args: FunctionArgs<typeof api.methods.trips.create>
  ) => {
    setIsPending(true)
    try {
      return await createTripMutation(args)
    } finally {
      setIsPending(false)
    }
  }

  return { mutate, isPending }
}

export const useUpdateTrip = () => {
  const [isPending, setIsPending] = useState(false)
  const updateTrip = useMutation(api.methods.trips.update)

  const mutate = async (
    args: FunctionArgs<typeof api.methods.trips.update>
  ) => {
    setIsPending(true)
    try {
      await updateTrip(args)
    } catch {
      console.error("Failed to update trip")
    } finally {
      setIsPending(false)
    }
  }

  return { mutate, isPending }
}

export const useRemoveTrip = () => {
  const [isPending, setIsPending] = useState(false)
  const removeTrip = useMutation(api.methods.trips.remove)

  const mutate = async (
    args: FunctionArgs<typeof api.methods.trips.remove>
  ) => {
    setIsPending(true)
    try {
      await removeTrip(args)
    } catch {
      console.error("Failed to remove trip")
    } finally {
      setIsPending(false)
    }
  }

  return { mutate, isPending }
}
