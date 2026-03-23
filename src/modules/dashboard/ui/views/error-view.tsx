import { HomeIcon, RefreshCwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StackedPanels } from "../components/stacked-cards"
import { Link } from "@tanstack/react-router"

export const ErrorView = () => {
    return (
        <section className="relative w-full h-dvh overflow-hidden bg-background flex flex-col items-center justify-center">
            <div
                className="pointer-events-none absolute inset-0 z-10 opacity-[0.03]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "repeat",
                    backgroundSize: "128px 128px",
                }}
            />

            <p className="absolute top-8 left-1/2 -translate-x-1/2 z-20 text-xs tracking-[0.25em] uppercase text-muted-foreground font-mono select-none">
                Safarnama
            </p>

            <StackedPanels />

            <div className="absolute bottom-0 inset-x-0 z-20 flex flex-col items-center gap-3 pb-10 pt-16 bg-linear-to-t from-background via-background/80 to-transparent">
                <h1 className="text-lg font-semibold text-foreground">
                    Something went wrong
                </h1>
                <p className="max-w-xs text-center text-sm text-muted-foreground">
                    An unexpected error occurred. Your journey data is safe.
                </p>
                <div className="flex gap-3 mt-1">
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        render={<Link to={window.location.href} />}
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
    )
}