import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRightIcon, MapPinIcon } from "lucide-react";
import type { Id } from "@backend/dataModel";
import { Button } from "@/components/ui/button";
import {
    Credenza,
    CredenzaBody,
    CredenzaContent,
    CredenzaDescription,
    CredenzaHeader,
    CredenzaTitle,
} from "@/components/ui/credenza";

type ResolvedPlace = {
    _id: Id<"place">;
    name: string;
    lat?: number;
    lng?: number;
};

interface BlogPlacesListProps {
    places?: ResolvedPlace[];
    variant?: "default" | "compact";
}

function CompactList({ places }: { places: ResolvedPlace[] }) {
    const [open, setOpen] = useState(false);
    const visible = places.slice(0, 3);
    const hasMore = places.length > 3;

    return (
        <section className="flex flex-col">
            <p className="mb-2 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                Places
            </p>
            <ol className="flex flex-col divide-y divide-border/40">
                {visible.map((place, i) => (
                    <li key={place._id}>
                        <Link
                            to="/place/$placeId"
                            params={{ placeId: place._id }}
                            className="group flex items-center gap-3 py-2 transition-colors hover:text-primary"
                        >
                            <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                                {String(i + 1).padStart(2, "0")}
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col">
                                <span className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                                    {place.name}
                                </span>
                                {place.lat !== undefined &&
                                    place.lng !== undefined && (
                                        <span className="truncate text-xs text-muted-foreground">
                                            {place.lat.toFixed(4)},{" "}
                                            {place.lng.toFixed(4)}
                                        </span>
                                    )}
                            </span>
                            {place.lat !== undefined &&
                                place.lng !== undefined && (
                                    <MapPinIcon className="size-3 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-primary" />
                                )}
                        </Link>
                    </li>
                ))}
            </ol>

            {hasMore && (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setOpen(true)}
                    className="mt-2 h-8 self-start px-2 text-xs text-muted-foreground hover:text-primary"
                >
                    Show all {places.length} places
                    <ChevronRightIcon className="ml-1 size-3.5" />
                </Button>
            )}

            <Credenza open={open} onOpenChange={setOpen}>
                <CredenzaContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
                    <CredenzaHeader>
                        <CredenzaTitle>All places</CredenzaTitle>
                        <CredenzaDescription>
                            {places.length}{" "}
                            {places.length === 1 ? "stop" : "stops"} from this
                            journey.
                        </CredenzaDescription>
                    </CredenzaHeader>
                    <CredenzaBody>
                        <BlogPlacesList places={places} variant="default" />
                    </CredenzaBody>
                </CredenzaContent>
            </Credenza>
        </section>
    );
}

export function BlogPlacesList({
    places,
    variant = "default",
}: BlogPlacesListProps) {
    if (!places || places.length === 0) return null;

    if (variant === "compact") {
        return <CompactList places={places} />;
    }

    return (
        <section className="border-t border-border pt-4">
            <ol className="grid gap-x-8 sm:grid-cols-2">
                {places.map((place, i) => (
                    <li
                        key={place._id}
                        className="border-b border-border/60 last:border-b-0 sm:[&:nth-last-child(2):nth-child(odd)]:border-b-0"
                    >
                        <Link
                            to="/place/$placeId"
                            params={{ placeId: place._id }}
                            className="group -mx-1 flex items-baseline gap-4 rounded-md px-4 py-3 transition-colors hover:bg-muted/40"
                        >
                            <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                                {String(i + 1).padStart(2, "0")}
                            </span>
                            <span className="flex-1 font-serif text-base text-foreground transition-colors group-hover:text-primary">
                                {place.name}
                            </span>
                            {place.lat !== undefined &&
                                place.lng !== undefined && (
                                    <MapPinIcon className="size-3.5 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-primary" />
                                )}
                        </Link>
                    </li>
                ))}
            </ol>
        </section>
    );
}
