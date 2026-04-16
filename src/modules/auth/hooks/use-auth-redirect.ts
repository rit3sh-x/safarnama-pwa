import { useEffect, useRef, useState } from "react";
import { useRouter, useRouterState } from "@tanstack/react-router";
import { useAuthentication } from "./use-authentication";

const REDIRECT_SETTLE_MS = 500;

const AUTH_ROUTES = [
    "/onboarding",
    "/signin",
    "/create-account",
    "/two-factor",
    "/create-username",
];

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

export function useAuthRedirect() {
    const auth = useAuthentication();
    const router = useRouter();
    const pathname = useRouterState({ select: (s) => s.location.pathname });
    const settleUntilRef = useRef(0);
    const [, setSettleTick] = useState(0);

    useEffect(() => {
        const enteringAuthFlow = AUTH_ROUTES.some((p) =>
            pathname.startsWith(p)
        );
        if (!enteringAuthFlow) {
            settleUntilRef.current = 0;
            return;
        }

        settleUntilRef.current = Date.now() + REDIRECT_SETTLE_MS;
        const timer = setTimeout(() => {
            setSettleTick((v) => v + 1);
        }, REDIRECT_SETTLE_MS);

        return () => clearTimeout(timer);
    }, [pathname]);

    useEffect(() => {
        const isSettling = Date.now() < settleUntilRef.current;
        if (auth.isLoading || isSettling || pathname === "/") return;

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
