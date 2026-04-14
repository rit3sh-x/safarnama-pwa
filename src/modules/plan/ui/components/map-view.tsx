import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import {
    Map,
    MapMarker,
    MarkerContent,
    MarkerTooltip,
    MapRoute,
    useMap,
    type MapRef,
} from "@/components/ui/map";
import type { PathEntry } from "../../hooks/use-route-planner";
import { PATH_COLORS } from "../../constants";
import { PlaceMarker } from "./place-marker";
import type { Doc, Id } from "@backend/dataModel";

interface MapClickEvent {
    lng: number;
    lat: number;
}

interface MapViewProps {
    places?: Doc<"place">[];
    dayPlaces?: Doc<"place">[];
    routes?: PathEntry[];
    userLocation?: { lat: number; lng: number } | null;
    selectedPlaceId?: Id<"place"> | null;
    onMarkerClick?: (id: Id<"place">) => void;
    onMapClick?: ((e: MapClickEvent) => void) | null;
    center?: [number, number];
    zoom?: number;
    fitKey?: number;
    dayOrderMap?: Record<string, number[]>;
    leftWidth?: number;
    rightWidth?: number;
    hasInspector?: boolean;
}

function MapInteractions({
    onClick,
}: {
    onClick: ((e: MapClickEvent) => void) | null | undefined;
}) {
    const { map } = useMap();

    useEffect(() => {
        if (!map || !onClick) return;
        const handler = (e: L.LeafletMouseEvent) => {
            onClick({ lng: e.latlng.lng, lat: e.latlng.lat });
        };
        map.on("click", handler);
        return () => {
            map.off("click", handler);
        };
    }, [map, onClick]);

    return null;
}

function BoundsFitter({
    places,
    fitKey,
    padding,
}: {
    places: Doc<"place">[];
    fitKey: number;
    padding: { top: number; right: number; bottom: number; left: number };
}) {
    const { map, isLoaded } = useMap();
    const prevKey = useRef(-1);

    useEffect(() => {
        if (!map || !isLoaded) return;
        if (fitKey === prevKey.current) return;
        prevKey.current = fitKey;

        const latlngs = places
            .filter((p) => p.lat && p.lng)
            .map((p) => [p.lat!, p.lng!] as L.LatLngTuple);
        if (latlngs.length === 0) return;

        const bounds = L.latLngBounds(latlngs);

        map.fitBounds(bounds, {
            paddingTopLeft: [padding.left, padding.top],
            paddingBottomRight: [padding.right, padding.bottom],
            maxZoom: 15,
            animate: true,
            duration: 0.6,
        });
    }, [map, isLoaded, places, fitKey, padding]);

    return null;
}

function SelectionPanner({
    places,
    selectedPlaceId,
}: {
    places: Doc<"place">[];
    selectedPlaceId: Id<"place"> | null | undefined;
}) {
    const { map } = useMap();
    const prev = useRef<Id<"place"> | null>(null);

    useEffect(() => {
        if (!map || !selectedPlaceId) {
            prev.current = selectedPlaceId ?? null;
            return;
        }
        if (selectedPlaceId === prev.current) return;
        prev.current = selectedPlaceId;
        const selected = places.find((p) => p._id === selectedPlaceId);
        if (selected?.lat && selected?.lng) {
            map.panTo([selected.lat, selected.lng], { animate: true });
        }
    }, [map, places, selectedPlaceId]);

    return null;
}

export function MapView({
    places = [],
    dayPlaces = [],
    routes = [],
    userLocation = null,
    selectedPlaceId = null,
    onMarkerClick,
    onMapClick,
    center = [2.3522, 48.8566],
    zoom = 10,
    fitKey = 0,
    dayOrderMap = {},
    leftWidth = 0,
    rightWidth = 0,
    hasInspector = false,
}: MapViewProps) {
    const mapRef = useRef<MapRef>(null);

    const padding = useMemo(() => {
        const isMobile =
            typeof window !== "undefined" && window.innerWidth < 768;
        if (isMobile) {
            return { top: 40, right: 20, bottom: 40, left: 20 };
        }
        return {
            top: 60,
            left: leftWidth + 40,
            right: rightWidth + 40,
            bottom: hasInspector ? 320 : 60,
        };
    }, [leftWidth, rightWidth, hasInspector]);

    const boundsSource = dayPlaces.length > 0 ? dayPlaces : places;

    return (
        <Map
            ref={mapRef}
            className="size-full"
            center={center}
            zoom={zoom}
            minZoom={2}
            maxZoom={20}
        >
            <MapInteractions onClick={onMapClick} />
            <BoundsFitter
                places={boundsSource}
                fitKey={fitKey}
                padding={padding}
            />
            <SelectionPanner
                places={places}
                selectedPlaceId={selectedPlaceId}
            />

            {places.map((place) => {
                if (!place.lat || !place.lng) return null;
                const isSelected = place._id === selectedPlaceId;
                const orderNumbers = dayOrderMap[place._id] ?? null;
                return (
                    <MapMarker
                        key={place._id}
                        longitude={place.lng}
                        latitude={place.lat}
                        onClick={() => onMarkerClick?.(place._id)}
                    >
                        <MarkerContent>
                            <PlaceMarker
                                place={place}
                                isSelected={isSelected}
                                orderNumbers={orderNumbers}
                            />
                        </MarkerContent>
                        <MarkerTooltip className="max-w-56">
                            <div className="font-semibold">{place.name}</div>
                            {place.address && (
                                <div className="mt-0.5 truncate opacity-70">
                                    {place.address}
                                </div>
                            )}
                        </MarkerTooltip>
                    </MapMarker>
                );
            })}

            {routes.map((r, i) =>
                r.coordinates.length > 1 ? (
                    <MapRoute
                        key={r.pathId}
                        coordinates={r.coordinates}
                        color={PATH_COLORS[i % PATH_COLORS.length]}
                        width={4}
                        opacity={0.85}
                    />
                ) : null
            )}

            {userLocation && (
                <MapMarker
                    longitude={userLocation.lng}
                    latitude={userLocation.lat}
                >
                    <MarkerContent>
                        <div className="relative flex size-4 items-center justify-center">
                            <span className="absolute inline-flex size-4 animate-ping rounded-full bg-blue-500/50" />
                            <span className="relative inline-flex size-3 rounded-full border-2 border-white bg-blue-500 shadow-md" />
                        </div>
                    </MarkerContent>
                    <MarkerTooltip>
                        <div className="text-xs font-semibold">
                            You are here
                        </div>
                    </MarkerTooltip>
                </MapMarker>
            )}
        </Map>
    );
}
