import { Outlet } from "@tanstack/react-router"
import { useIsMobile } from "@/hooks/use-mobile"
import { TopBar } from "../components/top-bar"
import { MobileTabBar } from "../components/mobile-tab-bar"
import { SwipeableOutlet } from "@/components/swipeable-outlet"
import { useTabNavigation } from "../../hooks/use-tab-navigation"

export const DashboardLayout = () => {
  const isMobile = useIsMobile()
  const {
    currentIndex,
    currentTab,
    direction,
    navigateToTab,
    navigateNext,
    navigatePrev,
  } = useTabNavigation()

  const title = currentTab.title

  if (isMobile) {
    return (
      <div className="flex h-dvh flex-col bg-background">
        <TopBar title={title} />
        <SwipeableOutlet
          currentIndex={currentIndex}
          direction={direction}
          onNext={navigateNext}
          onPrev={navigatePrev}
        />
        <MobileTabBar currentIndex={currentIndex} onTabPress={navigateToTab} />
      </div>
    )
  }

  return (
    <div className="h-full overflow-hidden">
      <Outlet />
    </div>
  )
}
