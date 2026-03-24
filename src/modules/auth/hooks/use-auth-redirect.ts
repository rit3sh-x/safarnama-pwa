import { useEffect, useRef } from "react";
import { useMatches, useRouter } from "@tanstack/react-router";
import { useAuthentication } from "./use-authentication";

type AuthState = "onboarding" | "auth" | "username" | "home" | "unknown";

function useRouteGroup() {
    const matches = useMatches();

    const inHome = matches.some((m) => m.routeId.startsWith("/(home)"));
    const inAuth = matches.some((m) => m.routeId.startsWith("/(auth)"));
    const inCustom = matches.some((m) => m.routeId.startsWith("/(custom)"));
    const inOnboarding = matches.some((m) => m.routeId === "/onboarding");

    return { inHome, inAuth, inCustom, inOnboarding };
}

function getAuthState(flags: {
    showOnboarding: boolean;
    showAuth: boolean;
    showUsername: boolean;
    showHome: boolean;
}): AuthState {
    if (flags.showOnboarding) return "onboarding";
    if (flags.showAuth) return "auth";
    if (flags.showUsername) return "username";
    if (flags.showHome) return "home";
    return "unknown";
}

export function useAuthRedirect() {
    const { isLoading, showOnboarding, showAuth, showUsername, showHome } =
        useAuthentication();
    const router = useRouter();
    const { inHome, inAuth, inCustom, inOnboarding } = useRouteGroup();
    const prevAuthStateRef = useRef<AuthState | null>(null);

    useEffect(() => {
        if (isLoading) return;

        const authState = getAuthState({
            showOnboarding,
            showAuth,
            showUsername,
            showHome,
        });

        const isInCorrectGroup =
            (authState === "onboarding" && inOnboarding) ||
            (authState === "auth" && inAuth) ||
            (authState === "username" && inAuth) ||
            (authState === "home" && (inHome || inCustom));

        if (isInCorrectGroup && prevAuthStateRef.current === authState) return;

        prevAuthStateRef.current = authState;

        if (showOnboarding && !inOnboarding) {
            router.navigate({ to: "/onboarding", replace: true });
        } else if (showAuth && !inAuth) {
            router.navigate({ to: "/signin", replace: true });
        } else if (showUsername && !inAuth) {
            router.navigate({ to: "/sign-up/create-username", replace: true });
        } else if (showHome && !inHome && !inCustom) {
            router.navigate({ to: "/dashboard", replace: true });
        }
    }, [
        isLoading,
        showOnboarding,
        showAuth,
        showUsername,
        showHome,
        inHome,
        inAuth,
        inCustom,
        inOnboarding,
        router,
    ]);

    return { isLoading };
}
