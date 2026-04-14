import { authClient } from "@/lib/auth-client";
import { changeUsername } from "@/modules/auth/hooks/auth-handlers";
import { TRIPS_STORAGE_KEYS } from "@/modules/trips/constants";

export function enableTwoFactor({ password }: { password: string }) {
    return authClient.twoFactor.enable({
        password,
        issuer: "safarnama",
    });
}

export function verifyTotp({ code }: { code: string }) {
    return authClient.twoFactor.verifyTotp({ code });
}

export function disableTwoFactor({ password }: { password: string }) {
    return authClient.twoFactor.disable({ password });
}

export function signOut({ onSuccess }: { onSuccess?: () => void }) {
    return authClient.signOut({
        fetchOptions: {
            onSuccess: () => {
                if (typeof window !== "undefined") {
                    for (const key of Object.values(TRIPS_STORAGE_KEYS)) {
                        localStorage.removeItem(key);
                    }
                }
                onSuccess?.();
            },
        },
    });
}

export function updateProfile({
    username,
    imageUrl,
    fetchOptions,
}: {
    username: string;
    imageUrl?: string;
    fetchOptions?: {
        onSuccess?: () => void;
        onError?: ({ error }: { error: unknown }) => void;
    };
}) {
    return changeUsername({ username, imageUrl, fetchOptions });
}
