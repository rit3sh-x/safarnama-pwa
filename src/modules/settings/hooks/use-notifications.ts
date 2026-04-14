import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@backend/api";
import { toast } from "sonner";
import {
    isSubscriptionEnabled,
    subscribeToPush,
    unsubscribeFromPush,
} from "@/hooks/use-subscription";
import { isRunningAsPWA } from "@/modules/home/hooks/use-pwa";

async function withTimeout<T>(
    task: Promise<T>,
    ms: number,
    fallback: T
): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        return await Promise.race([
            task,
            new Promise<T>((resolve) => {
                timer = setTimeout(() => resolve(fallback), ms);
            }),
        ]);
    } finally {
        if (timer) clearTimeout(timer);
    }
}

export function useNotifications() {
    const isPushCapable =
        typeof window !== "undefined" &&
        "Notification" in window &&
        "serviceWorker" in navigator &&
        "PushManager" in window;
    const isPwa = typeof window !== "undefined" && isRunningAsPWA();
    const supported = isPushCapable && isPwa;

    const [enabled, setEnabled] = useState(
        () => isSubscriptionEnabled() && supported
    );
    const [isPending, setIsPending] = useState(false);

    const subscribe = useMutation(
        api.methods.notifications.subscribe
    ).withOptimisticUpdate(() => {});
    const unsubscribe = useMutation(
        api.methods.notifications.unsubscribe
    ).withOptimisticUpdate(() => {});

    const toggle = useCallback(
        async (checked: boolean) => {
            if (isPending) return;

            if (!supported) {
                setEnabled(false);
                if (checked) {
                    toast.error("Install the app to enable push notifications");
                }
                return;
            }

            setEnabled(checked);
            setIsPending(true);

            try {
                if (checked) {
                    const success = await withTimeout(
                        subscribeToPush(subscribe),
                        8000,
                        false
                    );
                    if (!success) {
                        setEnabled(false);
                        toast.error("Notification permission denied");
                        return;
                    }
                    toast.success("Push notifications enabled");
                } else {
                    await withTimeout(
                        unsubscribeFromPush(unsubscribe),
                        5000,
                        undefined
                    );
                    toast.success("Push notifications disabled");
                }
            } catch (err) {
                setEnabled(!checked);
                toast.error(
                    err instanceof Error
                        ? err.message
                        : "Failed to update notifications"
                );
            } finally {
                setIsPending(false);
            }
        },
        [supported, isPending, subscribe, unsubscribe]
    );

    return {
        supported,
        isPushCapable,
        isPwa,
        enabled,
        isPending,
        toggle,
    };
}
