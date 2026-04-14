import { useEffect, useState, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function getInitialInstalled() {
    if (typeof window === "undefined") return false;

    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as unknown as { standalone?: boolean }).standalone === true
    );
}

export function isRunningAsPWA() {
    return getInitialInstalled();
}

export function usePWAInstall() {
    const [deferredPrompt, setDeferredPrompt] =
        useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState(getInitialInstalled);

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        const installedHandler = () => {
            setIsInstalled(true);
            setDeferredPrompt(null);
        };

        window.addEventListener("beforeinstallprompt", handler);
        window.addEventListener("appinstalled", installedHandler);

        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
            window.removeEventListener("appinstalled", installedHandler);
        };
    }, []);

    const install = useCallback(async () => {
        if (!deferredPrompt) return false;
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        setDeferredPrompt(null);
        return outcome === "accepted";
    }, [deferredPrompt]);

    return {
        canInstall: !!deferredPrompt && !isInstalled,
        isInstalled,
        install,
    };
}

export type Platform =
    | "windows"
    | "mac"
    | "android"
    | "linux"
    | "ios"
    | "unknown";

export function detectPlatform(): Platform {
    const ua = navigator.userAgent.toLowerCase();
    if (/android/.test(ua)) return "android";
    if (/iphone|ipad|ipod/.test(ua)) return "ios";
    if (/win/.test(ua)) return "windows";
    if (/mac/.test(ua)) return "mac";
    if (/linux/.test(ua)) return "linux";
    return "unknown";
}
