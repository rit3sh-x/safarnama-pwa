import { createContext } from "react";

export interface OnboardingContextValue {
    isOnboardingLoading: boolean;
    isFirstTime: boolean;
    completeOnboarding: () => void;
    resetOnboarding: () => void;
}

export const OnboardingContext = createContext<OnboardingContextValue | null>(
    null
);
