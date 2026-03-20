import { Outlet, useRouterState } from "@tanstack/react-router"
import { AnimatePresence, motion, type PanInfo } from "framer-motion"
import { useCallback, type RefObject } from "react"
import { TABS } from "../modules/dashboard/constants"

const SWIPE_THRESHOLD = 50
const SWIPE_VELOCITY = 500

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? "-100%" : "100%",
    opacity: 0,
  }),
}

interface SwipeableOutletProps {
  currentIndex: number
  direction: RefObject<number>
  onNext: () => void
  onPrev: () => void
}

export function SwipeableOutlet({
  currentIndex,
  direction,
  onNext,
  onPrev,
}: SwipeableOutletProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      const { offset, velocity } = info

      if (offset.x < -SWIPE_THRESHOLD || velocity.x < -SWIPE_VELOCITY) {
        onNext()
      } else if (offset.x > SWIPE_THRESHOLD || velocity.x > SWIPE_VELOCITY) {
        onPrev()
      }
    },
    [onNext, onPrev]
  )

  const canSwipeLeft = currentIndex < TABS.length - 1
  const canSwipeRight = currentIndex > 0

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden">
      <AnimatePresence
        initial={false}
        custom={direction.current}
        mode="popLayout"
      >
        <motion.div
          key={pathname}
          custom={direction.current}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 350, damping: 35 },
            opacity: { duration: 0.15 },
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragDirectionLock
          dragElastic={{
            left: canSwipeLeft ? 0.3 : 0,
            right: canSwipeRight ? 0.3 : 0,
          }}
          onDragEnd={handleDragEnd}
          className="absolute inset-0 overflow-y-auto"
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
