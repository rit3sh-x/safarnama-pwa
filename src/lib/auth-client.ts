import { createAuthClient } from "better-auth/react";
import type { BetterAuthClientOptions } from "better-auth/client";
import {
    usernameClient,
    organizationClient,
    twoFactorClient,
} from "better-auth/client/plugins";
import {
    convexClient,
    crossDomainClient,
} from "@convex-dev/better-auth/client/plugins";
import { ENV } from "varlock/env";

const authClientOptions = {
    baseURL: ENV.VITE_CONVEX_SITE_URL,
    plugins: [
        twoFactorClient(),
        convexClient(),
        usernameClient(),
        organizationClient(),
        crossDomainClient({
            storagePrefix: "safarnama",
        }),
    ],
} satisfies BetterAuthClientOptions;

type SafarnamaAuthClient = ReturnType<
    typeof createAuthClient<typeof authClientOptions>
>;

export const authClient: SafarnamaAuthClient =
    createAuthClient(authClientOptions);
