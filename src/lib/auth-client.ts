import { createAuthClient } from "better-auth/react";
import { usernameClient, organizationClient, twoFactorClient } from "better-auth/client/plugins";
import {
    convexClient,
    crossDomainClient,
} from "@convex-dev/better-auth/client/plugins";
import { ENV } from "varlock/env";

export const authClient = createAuthClient({
    baseURL: ENV.VITE_CONVEX_SITE_URL,
    plugins: [
        twoFactorClient(),
        crossDomainClient(),
        convexClient(),
        usernameClient(),
        organizationClient(),
    ],
});
