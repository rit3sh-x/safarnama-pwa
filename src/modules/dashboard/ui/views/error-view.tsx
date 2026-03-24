import { HomeIcon, RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StackedPanels } from "../components/stacked-cards";
import { Link, type ErrorComponentProps } from "@tanstack/react-router";
import { useEffect } from "react";
import { ENV } from "varlock/env";

export const ErrorView = ({ error, reset, info }: ErrorComponentProps) => {
    useEffect(() => {
        if (ENV.APP_ENV === "development") {
            console.error("Caught by TanStack Router ErrorView:", error, info);
        }
    }, [error, info]);

    return (
        <section className="relative flex h-dvh w-full flex-col items-center justify-center overflow-hidden bg-background">
            <div
                className="pointer-events-none absolute inset-0 z-10 opacity-[0.03]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "repeat",
                    backgroundSize: "128px 128px",
                }}
            />

            <p className="absolute top-8 left-1/2 z-20 -translate-x-1/2 font-mono text-xs tracking-[0.25em] text-muted-foreground uppercase select-none">
                Safarnama
            </p>

            <StackedPanels />

            <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-3 bg-linear-to-t from-background via-background/80 to-transparent pt-16 pb-10">
                <h1 className="text-lg font-semibold text-foreground">
                    Something went wrong
                </h1>
                <p className="max-w-xs text-center text-sm text-muted-foreground">
                    An unexpected error occurred. Your journey data is safe.
                </p>
                <div className="mt-1 flex gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={reset}
                    >
                        <RefreshCwIcon className="size-3.5" />
                        Try Again
                    </Button>
                    <Button
                        size="sm"
                        className="gap-1.5"
                        render={<Link to="/" />}
                    >
                        <HomeIcon className="size-3.5" />
                        Go Home
                    </Button>
                </div>
            </div>
        </section>
    );
};
