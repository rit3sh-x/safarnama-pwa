import { useState, useCallback } from "react";
import type { ReactNode } from "react";
import { USER_ONBOARDING_KEY } from "../constants";
import { OnboardingContext } from "./onboarding-context";

export function OnboardingProvider({ children }: { children: ReactNode }) {
    const [isCompleted, setIsCompleted] = useState(() => {
        return localStorage.getItem(USER_ONBOARDING_KEY) === "true";
    });

    const completeOnboarding = useCallback(() => {
        setIsCompleted(true);
        localStorage.setItem(USER_ONBOARDING_KEY, "true");
    }, []);

    const resetOnboarding = useCallback(() => {
        setIsCompleted(false);
        localStorage.setItem(USER_ONBOARDING_KEY, "false");
    }, []);

    return (
        <OnboardingContext.Provider
            value={{
                isOnboardingLoading: false,
                isFirstTime: !isCompleted,
                completeOnboarding,
                resetOnboarding,
            }}
        >
            {children}
        </OnboardingContext.Provider>
    );
}
