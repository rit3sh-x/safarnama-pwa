import { createFileRoute, Navigate } from "@tanstack/react-router"
import { useAuthentication } from "@/modules/auth/hooks/use-authentication"

export const Route = createFileRoute("/")({
  component: IndexRedirect,
})

function IndexRedirect() {
  const { isLoading, isAuthenticated, hasUsername } = useAuthentication()

  if (isLoading) return null

  if (isAuthenticated && hasUsername) {
    return <Navigate to="/dashboard" replace />
  }

  return <Navigate to="/signin" replace />
}
