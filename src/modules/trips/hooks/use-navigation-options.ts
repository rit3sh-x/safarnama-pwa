import { useAtom } from "jotai"
import { useCallback } from "react"
import { navOptionsAtom } from "../atoms"

export const useNavigationOptions = () => {
  const [tab, setTab] = useAtom(navOptionsAtom)

  const resetTab = useCallback(() => {
    setTab("trips")
  }, [setTab])

  return {
    tab,
    setTab,
    resetTab,
  }
}
