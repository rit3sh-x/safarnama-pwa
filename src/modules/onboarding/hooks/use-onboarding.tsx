import { useContext } from "react";
import { OnboardingContext } from "../context/onboarding-context";

export const useOnboarding = () => {
    const ctx = useContext(OnboardingContext);
    if (!ctx)
        throw new Error("useOnboarding must be used within OnboardingProvider");
    return ctx;
};
