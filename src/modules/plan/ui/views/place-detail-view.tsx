import { useCallback, useMemo, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { ArrowLeftIcon, ExternalLinkIcon, NavigationIcon } from "lucide-react";
import { useQuery } from "convex-helpers/react/cache";
import { MapView } from "../components/map-view";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { stringToHex, getInitials } from "@/lib/utils";
import { api } from "@backend/api";
import type { Id, Doc } from "@backend/dataModel";

interface PlaceDetailViewProps {
    placeId: Id<"place">;
}

function openGoogleMapsNavigation(lat: number, lng: number) {
    window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
        "_blank",
        "noopener"
    );
}

function openGoogleMapsView(lat: number, lng: number, name: string) {
    window.open(
        `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${encodeURIComponent(name)}`,
        "_blank",
        "noopener"
    );
}

export function PlaceDetailView({ placeId }: PlaceDetailViewProps) {
    const router = useRouter();
    const place = useQuery(api.methods.places.getPublic, { placeId });
    const isLoading = place === undefined;

    const mapPlaces = useMemo(
        () => (place && place.lat && place.lng ? [place as Doc<"place">] : []),
        [place]
    );

    const [selectedId, setSelectedId] = useState<Id<"place"> | null>(placeId);

    const handleMarkerClick = useCallback(
        (id: Id<"place">) => setSelectedId(id),
        []
    );

    const handleMapClick = useCallback(() => setSelectedId(null), []);

    if (isLoading) {
        return (
            <div className="flex h-dvh items-center justify-center bg-background">
                <Spinner className="size-8" />
            </div>
        );
    }

    if (!place) {
        return (
            <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-background">
                <p className="text-sm text-muted-foreground">
                    Place not found or not publicly accessible.
                </p>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.history.back()}
                >
                    <ArrowLeftIcon className="mr-1.5 size-3.5" />
                    Go back
                </Button>
            </div>
        );
    }

    const hasCoords =
        place.lat !== undefined &&
        place.lng !== undefined &&
        place.lat !== null &&
        place.lng !== null;

    const { bg, text } = stringToHex(place._id);
    const initials = getInitials(place.name) || "?";

    return (
        <div className="flex h-dvh flex-col bg-background">
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                <Button
                    aria-label="Go back"
                    variant="ghost"
                    size="icon"
                    className="size-9 shrink-0"
                    onClick={() => router.history.back()}
                >
                    <ArrowLeftIcon className="size-4" />
                </Button>
                <div className="flex min-w-0 items-center gap-2">
                    <span
                        className="flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                        style={{ backgroundColor: bg, color: text }}
                    >
                        {initials}
                    </span>
                    <span className="truncate text-sm font-medium">
                        {place.name}
                    </span>
                </div>
            </div>

            <div className="relative min-h-0 flex-1">
                {hasCoords ? (
                    <MapView
                        places={mapPlaces}
                        selectedPlaceId={selectedId}
                        onMarkerClick={handleMarkerClick}
                        onMapClick={handleMapClick}
                        center={[place.lng!, place.lat!]}
                        zoom={15}
                        fitKey={0}
                    />
                ) : (
                    <div className="flex h-full items-center justify-center">
                        <p className="text-sm text-muted-foreground">
                            No coordinates available for this place.
                        </p>
                    </div>
                )}

                <div className="absolute inset-x-0 bottom-0 z-1000 p-4 sm:right-4 sm:bottom-4 sm:left-auto sm:w-96 sm:p-0">
                    <div className="rounded-xl border border-border bg-background/95 shadow-lg backdrop-blur-sm">
                        <div className="p-5">
                            <div className="flex items-start gap-3">
                                {place.imageUrl ? (
                                    <img
                                        src={place.imageUrl}
                                        alt={place.name}
                                        className="size-12 shrink-0 rounded-lg object-cover"
                                    />
                                ) : (
                                    <span
                                        className="flex size-12 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
                                        style={{
                                            backgroundColor: bg,
                                            color: text,
                                        }}
                                    >
                                        {initials}
                                    </span>
                                )}
                                <div className="min-w-0 flex-1">
                                    <h2 className="font-serif text-lg leading-tight font-semibold text-foreground">
                                        {place.name}
                                    </h2>
                                    {place.address && (
                                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                            {place.address}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {place.description && (
                                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                                    {place.description}
                                </p>
                            )}

                            {hasCoords && (
                                <p className="mt-2 font-mono text-[11px] text-muted-foreground/60">
                                    {place.lat!.toFixed(4)},{" "}
                                    {place.lng!.toFixed(4)}
                                </p>
                            )}
                        </div>

                        {hasCoords && (
                            <div className="flex gap-2 border-t border-border p-3">
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="flex-1 gap-1.5"
                                    onClick={() =>
                                        openGoogleMapsNavigation(
                                            place.lat!,
                                            place.lng!
                                        )
                                    }
                                >
                                    <NavigationIcon className="size-3.5" />
                                    Navigate
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 gap-1.5"
                                    onClick={() =>
                                        openGoogleMapsView(
                                            place.lat!,
                                            place.lng!,
                                            place.name
                                        )
                                    }
                                >
                                    <ExternalLinkIcon className="size-3.5" />
                                    View on Maps
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
