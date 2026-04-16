import { Link } from "@tanstack/react-router";
import { MapPinIcon } from "lucide-react";
import type { Id } from "@backend/dataModel";

type ResolvedPlace = {
    _id: Id<"place">;
    name: string;
    lat?: number;
    lng?: number;
};

interface BlogPlacesListProps {
    places?: ResolvedPlace[];
}

export function BlogPlacesList({ places }: BlogPlacesListProps) {
    if (!places || places.length === 0) return null;

    return (
        <section className="mt-12 border-t border-border pt-10">
            <header className="mb-6">
                <p className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                    Places visited
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                    {places.length} {places.length === 1 ? "stop" : "stops"}{" "}
                    from this journey.
                </p>
            </header>

            <ol className="grid gap-x-8 sm:grid-cols-2">
                {places.map((place, i) => (
                    <li
                        key={place._id}
                        className="border-b border-border/60 last:border-b-0 sm:[&:nth-last-child(2):nth-child(odd)]:border-b-0"
                    >
                        <Link
                            to="/place/$placeId"
                            params={{ placeId: place._id }}
                            className="group -mx-1 flex items-baseline gap-4 rounded-md px-1 py-3 transition-colors hover:bg-muted/40"
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
