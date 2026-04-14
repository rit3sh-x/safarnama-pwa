const COOKIE_KEY = "safarnama_cookie";

/**
 * Workaround for @convex-dev/better-auth crossDomainClient bug where
 * get-session returning null wipes all cookies (including two_factor),
 * breaking 2FA sign-in flow. Preserves non-session cookies on empty writes.
 *
 * TODO: Remove once upstream PR is merged: https://github.com/get-convex/better-auth
 */
export const storage = {
    setItem(key: string, value: string) {
        if (key === COOKIE_KEY) {
            try {
                const incoming = JSON.parse(value);
                if (
                    typeof incoming === "object" &&
                    incoming !== null &&
                    Object.keys(incoming).length === 0
                ) {
                    const prev = localStorage.getItem(key);
                    if (prev) {
                        const prevParsed = JSON.parse(prev);
                        const preserved: Record<string, unknown> = {};
                        for (const [k, v] of Object.entries(prevParsed)) {
                            if (
                                !k.includes("session_token") &&
                                !k.includes("session_data") &&
                                !k.includes("convex_jwt")
                            ) {
                                preserved[k] = v;
                            }
                        }
                        localStorage.setItem(key, JSON.stringify(preserved));
                        return;
                    }
                }
            } catch {
                // Not JSON, fall through
            }
        }
        localStorage.setItem(key, value);
    },
    getItem(key: string) {
        return localStorage.getItem(key);
    },
};
