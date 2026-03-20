import { Outlet, useRouter } from "@tanstack/react-router"
import { useIsMobile } from "@/hooks/use-mobile"
import { useTripTabNavigation } from "../../hooks/use-trip-tab-navigation"
import { TripTabBar } from "../components/trip-tab-bar"
import { SwipeableOutlet } from "@/components/swipeable-outlet"
import { ChatHeader } from "../components/chat-header"
import type { TripId } from "../../types"
import { useAtomValue } from "jotai"
import { selectedTripAtom } from "../../atoms"

interface TripLayoutProps {
  tripId: TripId
}

export function TripLayout({ tripId }: TripLayoutProps) {
  const isMobile = useIsMobile()
  const router = useRouter()
  const trip = useAtomValue(selectedTripAtom)
  const { currentIndex, direction, navigateToTab, navigateNext, navigatePrev } =
    useTripTabNavigation(tripId)

  if (isMobile) {
    return (
      <div className="flex h-dvh flex-col bg-background">
        <ChatHeader
          name={trip?.name ?? "Trip"}
          tripId={tripId}
          logo={trip?.logo}
          onBack={() => router.history.back()}
          onGroupPress={() =>
            router.navigate({ to: "/trips/$tripId/info", params: { tripId } })
          }
        />
        <SwipeableOutlet
          currentIndex={currentIndex}
          direction={direction}
          onNext={navigateNext}
          onPrev={navigatePrev}
        />
        <TripTabBar currentIndex={currentIndex} onTabPress={navigateToTab} />
      </div>
    )
  }

  return <Outlet />
}
