import { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@backend/api";
import { useAuthentication } from "@/modules/auth/hooks/use-authentication";

type NavigatorBadge = {
    setAppBadge?: (count?: number) => Promise<void>;
    clearAppBadge?: () => Promise<void>;
};

export function useAppBadge() {
    const { user } = useAuthentication();
    const unreadCount = useQuery(
        api.methods.notifications.unreadCount,
        user ? {} : "skip"
    );

    useEffect(() => {
        if (typeof navigator === "undefined") return;
        const nav = navigator as Navigator & NavigatorBadge;
        if (typeof nav.setAppBadge !== "function") return;
        if (unreadCount === undefined) return;

        if (unreadCount > 0) {
            nav.setAppBadge(unreadCount).catch(() => {});
        } else {
            nav.clearAppBadge?.().catch(() => {});
        }
    }, [unreadCount]);
}
