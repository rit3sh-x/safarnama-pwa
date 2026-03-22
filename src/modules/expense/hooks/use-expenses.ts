import { PAGINATION } from "@/lib/constants"
import { api } from "@backend/api"
import { useMutation, usePaginatedQuery } from "convex/react"
import { useQuery } from "convex-helpers/react/cache"
import type { FunctionArgs } from "convex/server"
import { useState } from "react"
import type { Id } from "@backend/dataModel"

export function useExpenses(tripId: Id<"trip"> | undefined) {
  const listQuery = api.methods.expenses.list as unknown as Parameters<
    typeof usePaginatedQuery
  >[0]
  const { results, status, loadMore } = usePaginatedQuery(
    listQuery,
    tripId ? { tripId } : "skip",
    { initialNumItems: PAGINATION.TRIPS_PAGE_SIZE }
  )

  return {
    expenses: results,
    isLoading: status === "LoadingFirstPage",
    isDone: status === "Exhausted",
    loadMore: () => loadMore(PAGINATION.TRIPS_PAGE_SIZE),
  }
}

export function useBalances(tripId: Id<"trip"> | undefined) {
  const data = useQuery(
    api.methods.expenses.balances,
    tripId ? { tripId } : "skip"
  )

  return {
    balances: data,
    isLoading: data === undefined,
  }
}

export function useSettlements(tripId: Id<"trip"> | undefined) {
  const data = useQuery(
    api.methods.expenses.listSettlements,
    tripId ? { tripId } : "skip"
  )

  return {
    settlements: data,
    isLoading: data === undefined,
  }
}

export const useCreateExpense = () => {
  const [isPending, setIsPending] = useState(false)
  const createExpense = useMutation(api.methods.expenses.create)

  const mutate = async (
    args: FunctionArgs<typeof api.methods.expenses.create>
  ) => {
    setIsPending(true)
    try {
      return await createExpense(args)
    } finally {
      setIsPending(false)
    }
  }

  return { mutate, isPending }
}

export const useRemoveExpense = () => {
  const [isPending, setIsPending] = useState(false)
  const removeExpense = useMutation(api.methods.expenses.remove)

  const mutate = async (
    args: FunctionArgs<typeof api.methods.expenses.remove>
  ) => {
    setIsPending(true)
    try {
      await removeExpense(args)
    } finally {
      setIsPending(false)
    }
  }

  return { mutate, isPending }
}

export const useSettleSplit = () => {
  const [isPending, setIsPending] = useState(false)
  const settleSplit = useMutation(api.methods.expenses.settleSplit)

  const mutate = async (
    args: FunctionArgs<typeof api.methods.expenses.settleSplit>
  ) => {
    setIsPending(true)
    try {
      await settleSplit(args)
    } finally {
      setIsPending(false)
    }
  }

  return { mutate, isPending }
}

export const useCreateSettlement = () => {
  const [isPending, setIsPending] = useState(false)
  const createSettlement = useMutation(api.methods.expenses.createSettlement)

  const mutate = async (
    args: FunctionArgs<typeof api.methods.expenses.createSettlement>
  ) => {
    setIsPending(true)
    try {
      return await createSettlement(args)
    } finally {
      setIsPending(false)
    }
  }

  return { mutate, isPending }
}

export function useGlobalExpenseSummary() {
  const data = useQuery(api.methods.expenses.globalSummary, {})

  return {
    summary: data,
    isLoading: data === undefined,
  }
}
