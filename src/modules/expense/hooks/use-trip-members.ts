import { api } from "@backend/api"
import { useQuery } from "convex/react"
import type { Id } from "@backend/dataModel"

export function useTripMembers(tripId: Id<"trip"> | undefined) {
  const members = useQuery(
    api.methods.members.listAll,
    tripId ? { tripId } : "skip"
  )

  return {
    members: members ?? [],
    isLoading: members === undefined,
  }
}
