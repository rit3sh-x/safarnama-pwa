import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@backend/api";
import { toast } from "sonner";
import {
    isSubscriptionEnabled,
    subscribeToPush,
    unsubscribeFromPush,
} from "@/hooks/use-subscription";

export function useNotifications() {
    const supported =
        typeof window !== "undefined" &&
        "Notification" in window &&
        "serviceWorker" in navigator &&
        "PushManager" in window;

    const [enabled, setEnabled] = useState(() => isSubscriptionEnabled());
    const [isPending, setIsPending] = useState(false);

    const subscribe = useMutation(api.methods.notifications.subscribe);
    const unsubscribe = useMutation(api.methods.notifications.unsubscribe);

    const toggle = useCallback(
        async (checked: boolean) => {
            if (!supported || isPending) return;

            setEnabled(checked);
            setIsPending(true);

            try {
                if (checked) {
                    const success = await subscribeToPush(subscribe);
                    if (!success) {
                        setEnabled(false);
                        toast.error("Notification permission denied");
                        return;
                    }
                    toast.success("Push notifications enabled");
                } else {
                    await unsubscribeFromPush(unsubscribe);
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

    return { supported, enabled, isPending, toggle };
}
