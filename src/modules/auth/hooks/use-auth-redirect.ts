import { useEffect } from "react";
import { useMatches, useRouter } from "@tanstack/react-router";
import { useAuthentication } from "./use-authentication";

type AuthState = "onboarding" | "auth" | "username" | "home";

const AUTH_ROUTES: Record<AuthState, string> = {
    onboarding: "/onboarding",
    auth: "/signin",
    username: "/sign-up/create-username",
    home: "/dashboard",
};

const ALLOWED_GROUPS: Record<AuthState, string[]> = {
    onboarding: ["/onboarding"],
    auth: ["/(auth)"],
    username: ["/(auth)"],
    home: ["/(home)", "/(custom)"],
};

function resolveAuthState(flags: {
    showOnboarding: boolean;
    showAuth: boolean;
    showUsername: boolean;
    showHome: boolean;
}): AuthState | null {
    if (flags.showOnboarding) return "onboarding";
    if (flags.showAuth) return "auth";
    if (flags.showUsername) return "username";
    if (flags.showHome) return "home";
    return null;
}

export function useAuthRedirect() {
    const { isLoading, showOnboarding, showAuth, showUsername, showHome } =
        useAuthentication();
    const router = useRouter();
    const matches = useMatches();

    useEffect(() => {
        if (isLoading) return;

        const authState = resolveAuthState({
            showOnboarding,
            showAuth,
            showUsername,
            showHome,
        });

        if (!authState) return;

        const isOnIndex =
            matches.length > 0 && matches[matches.length - 1].routeId === "/";
        if (isOnIndex) return;

        const allowedPatterns = ALLOWED_GROUPS[authState];
        const isInAllowedGroup = matches.some((m) =>
            allowedPatterns.some((pattern) => m.routeId.includes(pattern))
        );

        if (isInAllowedGroup && authState !== "username") return;

        router.navigate({ to: AUTH_ROUTES[authState], replace: true });
    }, [
        isLoading,
        showOnboarding,
        showAuth,
        showUsername,
        showHome,
        matches,
        router,
    ]);

    return { isLoading };
}
