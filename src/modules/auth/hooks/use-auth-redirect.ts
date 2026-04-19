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
            "/place",
            "/public",
        ],
    },
] as const;

function isCrossDomainHandoff() {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    return params.has("ott") || params.has("convex_token");
}

export function useAuthRedirect() {
    const auth = useAuthentication();
    const router = useRouter();
    const pathname = useRouterState({ select: (s) => s.location.pathname });
    const search = useRouterState({ select: (s) => s.location.searchStr });

    useEffect(() => {
        if (auth.isLoading || pathname === "/") return;
        if (isCrossDomainHandoff()) return;

        for (const rule of AUTH_REDIRECTS) {
            if (!auth[rule.check]) continue;

            const isAllowed = rule.allow.some((p) => pathname.startsWith(p));
            if (isAllowed) return;

            router.navigate({ to: rule.to, replace: true });
            return;
        }
    }, [auth, pathname, search, router]);

    return { isLoading: auth.isLoading };
}
