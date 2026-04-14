import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

export const signInWithUsername = ({
    password,
    username,
    fetchOptions,
}: {
    username: string;
    password: string;
    fetchOptions?: {
        onSuccess?: () => void;
        onError?: ({ error }: { error: unknown }) => void;
    };
}) => {
    return authClient.signIn.username(
        { username, password },
        {
            onSuccess: fetchOptions?.onSuccess,
            onError: ({ error }) => {
                toast.error(
                    error instanceof Error ? error.message : "Sign in failed"
                );
                fetchOptions?.onError?.({ error });
            },
        }
    );
};

export const signInWithEmail = ({
    password,
    email,
    fetchOptions,
}: {
    email: string;
    password: string;
    fetchOptions?: {
        onSuccess?: (context: {
            data: { twoFactorRedirect?: boolean };
        }) => void;
        onError?: ({ error }: { error: unknown }) => void;
    };
}) => {
    return authClient.signIn.email(
        { email, password },
        {
            onSuccess: (context) => fetchOptions?.onSuccess?.(context),
            onError: ({ error }) => {
                toast.error(
                    error instanceof Error ? error.message : "Sign in failed"
                );
                fetchOptions?.onError?.({ error });
            },
        }
    );
};

export const signUpWithEmail = ({
    password,
    email,
    name,
    fetchOptions,
}: {
    email: string;
    password: string;
    name: string;
    fetchOptions?: {
        onSuccess?: () => void;
        onError?: ({ error }: { error: unknown }) => void;
    };
}) => {
    return authClient.signUp.email(
        { email, password, name },
        {
            onSuccess: fetchOptions?.onSuccess,
            onError: ({ error }) => {
                toast.error(
                    error instanceof Error ? error.message : "Sign up failed"
                );
                fetchOptions?.onError?.({ error });
            },
        }
    );
};

export async function signInWithGoogle() {
    try {
        return await authClient.signIn.social({
            provider: "google",
            callbackURL: "/create-username",
        });
    } catch (err) {
        toast.error(
            err instanceof Error ? err.message : "Google sign in failed"
        );
    }
}

export function verifyTotp({
    code,
    trustDevice = false,
    fetchOptions,
}: {
    code: string;
    trustDevice?: boolean;
    fetchOptions?: {
        onSuccess?: () => void;
        onError?: ({ error }: { error: unknown }) => void;
    };
}) {
    return authClient.twoFactor.verifyTotp(
        {
            code: code.padStart(6, "0"),
            trustDevice,
        },
        {
            onSuccess: fetchOptions?.onSuccess,
            onError: ({ error }) => {
                toast.error(
                    error instanceof Error
                        ? error.message
                        : "Verification failed. Please try again."
                );
                fetchOptions?.onError?.({ error });
            },
        }
    );
}

export async function changeUsername({
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
    return authClient.updateUser(
        { username, image: imageUrl },
        {
            onSuccess: fetchOptions?.onSuccess,
            onError: ({ error }) => {
                toast.error(
                    error instanceof Error
                        ? error.message
                        : "Failed to update profile"
                );
                fetchOptions?.onError?.({ error });
            },
        }
    );
}
