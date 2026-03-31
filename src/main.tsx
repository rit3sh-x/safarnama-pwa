import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { ConvexReactClient } from "convex/react";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { ENV } from "varlock/env";
import { authClient } from "./lib/auth-client";
import { OnboardingProvider } from "./modules/onboarding/context/onboarding-provider";
import { AuthenticationProvider } from "./modules/auth/context/auth-provider";
import { NetworkModal } from "./components/network-modal";
import { ThemeProvider } from "./components/theme-provider";
import { Provider as JotaiProvider } from "jotai";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConvexQueryCacheProvider } from "convex-helpers/react/cache";
import "leaflet/dist/leaflet.css";

import { Toaster } from "@/components/ui/sonner";
import "./index.css";

const CACHE_EXPIRATION_TIME = 300000;

const router = createRouter({
    routeTree,
    defaultPreload: "intent",
    scrollRestoration: true,
});

const convex = new ConvexReactClient(ENV.VITE_CONVEX_URL, {
    expectAuth: true,
    unsavedChangesWarning: false,
});

declare module "@tanstack/react-router" {
    interface Register {
        router: typeof router;
    }
}

const rootElement = document.getElementById("root")!;

document.addEventListener("contextmenu", (e) => e.preventDefault());

if (!rootElement.innerHTML) {
    const root = createRoot(rootElement);

    root.render(
        <StrictMode>
            <JotaiProvider>
                <TooltipProvider>
                    <ThemeProvider>
                        <OnboardingProvider>
                            <ConvexBetterAuthProvider
                                client={convex}
                                authClient={authClient}
                            >
                                <ConvexQueryCacheProvider
                                    expiration={CACHE_EXPIRATION_TIME}
                                >
                                    <AuthenticationProvider>
                                        <RouterProvider router={router} />
                                        <NetworkModal />
                                        <Toaster />
                                    </AuthenticationProvider>
                                </ConvexQueryCacheProvider>
                            </ConvexBetterAuthProvider>
                        </OnboardingProvider>
                    </ThemeProvider>
                </TooltipProvider>
            </JotaiProvider>
        </StrictMode>
    );
}
