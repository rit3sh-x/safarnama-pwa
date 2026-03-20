import { useState, useCallback, useRef } from "react"
import { useAnimation } from "../components/animation"
import { useOnboarding } from "../../hooks/use-onboarding"
import { ONBOARDING_SCREENS } from "../../constants"
import { TextSlide } from "../components/text-slide"
import { ProgressDots } from "../components/progress-dots"

export function OnboardingView() {
  const [index, setIndex] = useState(0)
  const { completeOnboarding } = useOnboarding()
  const { Animation, invokeTrigger } = useAnimation()
  const transitioning = useRef(false)

  const screen = ONBOARDING_SCREENS[index]
  const isLast = index === ONBOARDING_SCREENS.length - 1

  const handleNext = useCallback(() => {
    if (transitioning.current) return
    transitioning.current = true

    if (isLast) {
      completeOnboarding()
      return
    }

    invokeTrigger()
    setIndex((prev) => prev + 1)

    transitioning.current = false
  }, [isLast, invokeTrigger, completeOnboarding])

  return (
    <div
      onClick={handleNext}
      className="flex h-screen w-full cursor-pointer flex-col bg-[#40aad4] md:grid md:grid-cols-2"
    >
      <div className="relative min-h-0 flex-1 md:flex-none">{Animation}</div>

      <div className="flex flex-col gap-8 px-7 pt-4 pb-14 md:flex-col-reverse md:justify-center md:px-6 lg:px-12">
        <TextSlide screen={screen} index={index} />

        <div className="flex w-full items-center justify-center">
          <ProgressDots total={ONBOARDING_SCREENS.length} current={index} />
        </div>
      </div>
    </div>
  )
}
