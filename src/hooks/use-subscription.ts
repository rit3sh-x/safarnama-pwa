import { useEffect, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@backend/api";
import { ENV } from "varlock/env";

const STORAGE_KEY = "safarnama-push-enabled";

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/");
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i++) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function isSupported() {
    return (
        typeof window !== "undefined" &&
        "Notification" in window &&
        "serviceWorker" in navigator &&
        "PushManager" in window
    );
}

export function isSubscriptionEnabled() {
    return isSupported() && localStorage.getItem(STORAGE_KEY) === "true";
}

export function setSubscriptionEnabled(value: boolean) {
    localStorage.setItem(STORAGE_KEY, String(value));
}

export async function subscribeToPush(
    subscribeMutation: ReturnType<
        typeof useMutation<typeof api.methods.notifications.subscribe>
    >
): Promise<boolean> {
    if (!isSupported()) return false;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;

    const registration = await navigator.serviceWorker.ready;
    const vapidKey = ENV.VITE_VAPID_PUBLIC_KEY;
    if (!vapidKey) return false;

    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    const subJson = subscription.toJSON();
    await subscribeMutation({
        endpoint: subJson.endpoint!,
        p256dh: subJson.keys!.p256dh!,
        auth: subJson.keys!.auth!,
    });

    setSubscriptionEnabled(true);
    return true;
}

export async function unsubscribeFromPush(
    unsubscribeMutation: ReturnType<
        typeof useMutation<typeof api.methods.notifications.unsubscribe>
    >
): Promise<void> {
    if (!isSupported()) return;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await unsubscribeMutation({ endpoint });
    }

    setSubscriptionEnabled(false);
}

export function usePushSubscriptionSync() {
    const subscribe = useMutation(api.methods.notifications.subscribe);
    const didSync = useRef(false);

    const syncSubscription = useCallback(async () => {
        if (!isSupported() || !isSubscriptionEnabled()) return;
        if (Notification.permission !== "granted") {
            setSubscriptionEnabled(false);
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            const vapidKey = ENV.VITE_VAPID_PUBLIC_KEY;
            if (!vapidKey) return;

            let subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(vapidKey),
                });
            }

            const subJson = subscription.toJSON();
            await subscribe({
                endpoint: subJson.endpoint!,
                p256dh: subJson.keys!.p256dh!,
                auth: subJson.keys!.auth!,
            });
        } catch {
            // Silent fail on sync
        }
    }, [subscribe]);

    useEffect(() => {
        if (didSync.current) return;
        didSync.current = true;
        syncSubscription();
    }, [syncSubscription]);
}
