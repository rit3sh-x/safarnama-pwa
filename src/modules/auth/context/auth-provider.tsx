import { useConvexAuth } from "convex/react";
import { useQuery } from "convex-helpers/react/cache";
import { api } from "@backend/api";
import { AuthenticationContext } from "./auth-context";
import { useOnboarding } from "@/modules/onboarding/hooks/use-onboarding";
import type { ReactNode } from "react";

export function AuthenticationProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated, isLoading: isConvexLoading } = useConvexAuth();
    const { isFirstTime, isOnboardingLoading } = useOnboarding();

    const user = useQuery(
        api.methods.users.currentUser,
        isAuthenticated ? {} : "skip"
    );
    const isUserLoading = isAuthenticated && user === undefined;

    const isLoading = isOnboardingLoading || isConvexLoading || isUserLoading;

    const hasUsername = !!user?.username;

    const showOnboarding = !isLoading && !isAuthenticated && isFirstTime;
    const showAuth = !isLoading && !isAuthenticated && !isFirstTime;
    const showUsername = !isLoading && isAuthenticated && !hasUsername;
    const showHome = !isLoading && isAuthenticated && hasUsername;

    return (
        <AuthenticationContext.Provider
            value={{
                isLoading,
                isAuthenticated,
                hasUsername,
                showOnboarding,
                showAuth,
                showUsername,
                showHome,
                user: user ?? null,
            }}
        >
            {children}
        </AuthenticationContext.Provider>
    );
}
