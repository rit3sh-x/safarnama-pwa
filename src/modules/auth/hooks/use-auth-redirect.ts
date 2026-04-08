import { useEffect } from "react";
import { useRouter, useRouterState } from "@tanstack/react-router";
import { useAuthentication } from "./use-authentication";

const AUTH_REDIRECTS = [
    { check: "showOnboarding", to: "/onboarding", allow: ["/onboarding"] },
    {
        check: "showAuth",
        to: "/signin",
        allow: ["/signin", "/create-account", "/two-factor"],
    },
    {
        check: "showUsername",
        to: "/create-username",
        allow: ["/create-username"],
    },
    {
        check: "showHome",
        to: "/dashboard",
        allow: [
            "/dashboard",
            "/trips",
            "/blogs",
            "/expenses",
            "/settings",
            "/plan",
            "/public",
        ],
    },
] as const;

export function useAuthRedirect() {
    const auth = useAuthentication();
    const router = useRouter();
    const pathname = useRouterState({ select: (s) => s.location.pathname });

    useEffect(() => {
        if (auth.isLoading || pathname === "/") return;

        for (const rule of AUTH_REDIRECTS) {
            if (!auth[rule.check]) continue;

            const isAllowed = rule.allow.some((p) => pathname.startsWith(p));
            if (isAllowed) return;

            router.navigate({ to: rule.to, replace: true });
            return;
        }
    }, [auth, pathname, router]);

    return { isLoading: auth.isLoading };
}
