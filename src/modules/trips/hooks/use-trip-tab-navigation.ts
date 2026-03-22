import { useCallback, useLayoutEffect, useRef } from "react"
import { useNavigate, useRouterState } from "@tanstack/react-router"
import { TRIP_TABS } from "../constants"
import type { Id } from "@backend/dataModel"

export function useTripTabNavigation(tripId: Id<"trip">) {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const currentIndex = TRIP_TABS.findIndex((tab) =>
    pathname.endsWith(tab.route)
  )
  const safeIndex = currentIndex === -1 ? 0 : currentIndex
  const indexRef = useRef(safeIndex)

  useLayoutEffect(() => {
    indexRef.current = safeIndex
  }, [safeIndex])

  const directionRef = useRef(0)

  const navigateToTab = useCallback(
    (index: number) => {
      if (index < 0 || index >= TRIP_TABS.length || index === indexRef.current)
        return
      directionRef.current = index > indexRef.current ? 1 : -1
      navigate({
        to: TRIP_TABS[index].route,
        params: { tripId },
      })
    },
    [navigate, tripId]
  )

  const navigateNext = useCallback(() => {
    navigateToTab(indexRef.current + 1)
  }, [navigateToTab])

  const navigatePrev = useCallback(() => {
    navigateToTab(indexRef.current - 1)
  }, [navigateToTab])

  return {
    currentIndex: safeIndex,
    currentTab: TRIP_TABS[safeIndex]!,
    direction: directionRef,
    navigateToTab,
    navigateNext,
    navigatePrev,
  }
}
