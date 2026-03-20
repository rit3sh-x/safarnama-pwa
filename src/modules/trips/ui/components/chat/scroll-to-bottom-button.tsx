import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"

interface ScrollToBottomButtonProps {
  scrollRef: React.RefObject<HTMLDivElement | null>
  onClick: () => void
}

export function ScrollToBottomButton({
  scrollRef,
  onClick,
}: ScrollToBottomButtonProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const check = () => {
      const threshold = 200
      const isNearBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight < threshold
      setVisible(!isNearBottom)
    }

    el.addEventListener("scroll", check, { passive: true })
    return () => el.removeEventListener("scroll", check)
  }, [scrollRef])

  if (!visible) return null

  return (
    <div className="pointer-events-none absolute right-4 bottom-24 z-20 flex justify-end md:right-8">
      <Button
        variant="outline"
        size="icon"
        className="pointer-events-auto h-10 w-10 rounded-full bg-card shadow-lg"
        onClick={onClick}
      >
        <ChevronDown className="size-5" />
      </Button>
    </div>
  )
}
