import { useCallback, useLayoutEffect, useRef } from "react"
import { useNavigate, useRouterState } from "@tanstack/react-router"
import { TABS } from "../constants"

export function useTabNavigation() {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const currentIndex = TABS.findIndex((tab) =>
    tab.route === "/" ? pathname === "/" : pathname.startsWith(tab.route)
  )
  const safeIndex = currentIndex === -1 ? 0 : currentIndex
  const indexRef = useRef(safeIndex)

  useLayoutEffect(() => {
    indexRef.current = safeIndex
  }, [safeIndex])

  const directionRef = useRef(0)

  const navigateToTab = useCallback(
    (index: number) => {
      if (index < 0 || index >= TABS.length || index === indexRef.current)
        return
      directionRef.current = index > indexRef.current ? 1 : -1
      navigate({ to: TABS[index].route })
    },
    [navigate]
  )

  const navigateNext = useCallback(() => {
    navigateToTab(indexRef.current + 1)
  }, [navigateToTab])

  const navigatePrev = useCallback(() => {
    navigateToTab(indexRef.current - 1)
  }, [navigateToTab])

  return {
    currentIndex: safeIndex,
    currentTab: TABS[safeIndex]!,
    direction: directionRef,
    navigateToTab,
    navigateNext,
    navigatePrev,
    tabs: TABS,
  }
}
