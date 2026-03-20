import { OnboardingView } from "@/modules/onboarding/ui/views/onboarding-view"
import { createFileRoute } from "@tanstack/react-router"
import { Unauthenticated } from "convex/react"

export const Route = createFileRoute("/onboarding")({
  component: Page,
})

function Page() {
  return (
    <Unauthenticated>
      <OnboardingView />
    </Unauthenticated>
  )
}
