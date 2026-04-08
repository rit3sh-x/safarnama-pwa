import { useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAuthentication } from "@/modules/auth/hooks/use-authentication";
import { usePWAInstall, detectPlatform } from "../../hooks/use-pwa";
import { CrowdCanvas } from "../components/crowd-canvas";

const PLATFORM_INFO: Record<string, { label: string; icon: string }> = {
    windows: { label: "Windows", icon: "/platforms/windows.svg" },
    mac: { label: "macOS", icon: "/platforms/apple.svg" },
    android: { label: "Android", icon: "/platforms/android.svg" },
    linux: { label: "Linux", icon: "/platforms/linux.svg" },
    ios: { label: "iOS", icon: "/platforms/apple.svg" },
    unknown: { label: "your device", icon: "/platforms/windows.svg" },
};

export function HomeView() {
    const navigate = useNavigate();
    const { isAuthenticated, hasUsername } = useAuthentication();
    const { canInstall, isInstalled, install } = usePWAInstall();
    const platform = useMemo(() => detectPlatform(), []);
    const platformInfo = PLATFORM_INFO[platform] ?? PLATFORM_INFO.unknown;

    return (
        <div className="relative h-dvh w-full overflow-hidden bg-white text-black">
            <div className="absolute top-22 left-1/2 z-10 grid -translate-x-1/2 content-start justify-items-center gap-6 text-center">
                <h1 className="text-5xl font-bold tracking-tight sm:text-7xl lg:text-8xl">
                    Safarnama
                </h1>
                <p className="max-w-md text-sm text-black/60 sm:text-base">
                    Plan trips, split expenses, chat in real-time, and share
                    your journey all in one place.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                    <Button
                        size="lg"
                        className="rounded-full bg-black px-8 text-white hover:bg-black/90"
                        onClick={() =>
                            navigate({
                                to:
                                    isAuthenticated && hasUsername
                                        ? "/dashboard"
                                        : "/onboarding",
                            })
                        }
                    >
                        {isAuthenticated && hasUsername
                            ? "Go to Dashboard"
                            : "Get Started"}
                    </Button>

                    {canInstall && (
                        <Button
                            size="lg"
                            variant="outline"
                            className="gap-2 rounded-full border-black/20 bg-white px-6 text-black hover:bg-black/5"
                            onClick={install}
                        >
                            <img
                                src={platformInfo.icon}
                                alt={platformInfo.label}
                                className="size-4"
                            />
                            Install for {platformInfo.label}
                        </Button>
                    )}

                    {isInstalled && !canInstall && (
                        <a
                            href={window.location.origin}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-black/20 bg-white px-6 text-sm font-medium text-black hover:bg-black/5"
                        >
                            <img
                                src={platformInfo.icon}
                                alt={platformInfo.label}
                                className="size-4"
                            />
                            Open App
                        </a>
                    )}
                </div>
            </div>

            <CrowdCanvas src="/images/peeps/sheet.png" rows={15} cols={7} />
        </div>
    );
}
