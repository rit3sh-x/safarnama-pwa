const COOKIE_KEY = "safarnama_cookie";

/**
 * Workaround for @convex-dev/better-auth crossDomainClient: when get-session
 * returns null it writes "{}" and wipes cookies — including the two_factor
 * challenge token needed for verifyTotp. Mirror upstream PR #325: on empty
 * writes, preserve non-session cookies (two_factor, etc.) and drop the
 * session_token/session_data/convex_jwt triple.
 *
 * TODO: Remove once upstream PR merged: https://github.com/get-convex/better-auth/pull/325
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
                        const parsed = JSON.parse(prev) as Record<
                            string,
                            unknown
                        >;
                        const preserved: Record<string, unknown> = {};
                        for (const [k, v] of Object.entries(parsed)) {
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
    removeItem(key: string) {
        localStorage.removeItem(key);
    },
};
