import { api } from "@backend/api"
import { useQuery } from "convex-helpers/react/cache"

export function useUserSearch(query: string, excludeUserIds?: string[]) {
  const results = useQuery(
    api.methods.search.searchUsers,
    query.trim().length > 0 ? { query: query.trim(), excludeUserIds } : "skip"
  )

  return {
    users: results ?? [],
    isLoading: results === undefined && query.trim().length > 0,
  }
}
