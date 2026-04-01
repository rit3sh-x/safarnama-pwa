import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { usePushSubscriptionSync } from "@/hooks/use-subscription";

export function PushSync() {
    usePushSubscriptionSync();
    const navigate = useNavigate();

    useEffect(() => {
        const handler = (event: MessageEvent) => {
            if (event.data?.type === "NOTIFICATION_CLICK" && event.data.url) {
                navigate({ to: event.data.url });
            }
        };

        navigator.serviceWorker?.addEventListener("message", handler);
        return () => {
            navigator.serviceWorker?.removeEventListener("message", handler);
        };
    }, [navigate]);

    return null;
}
