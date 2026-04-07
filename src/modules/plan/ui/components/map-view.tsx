import { useEffect, useRef, useState, useMemo } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    Tooltip,
    Polyline,
    useMap,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L, {
    type FitBoundsOptions,
    type LatLngTuple,
    type LeafletMouseEventHandlerFn,
} from "leaflet";
import { useAtomValue } from "jotai";
import type { Doc, Id } from "@backend/dataModel";
import { stringToHex } from "@/lib/utils";
import { mapStyleAtom } from "@/modules/settings/atoms";
import { MAP_TILE_URLS } from "@/modules/settings/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function escAttr(s: string) {
    if (!s) return "";
    return s
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function createPlaceIcon(
    place: Doc<"place">,
    orderNumbers: number[] | null,
    isSelected: boolean
) {
    const size = isSelected ? 44 : 36;
    const borderColor = isSelected ? "#111827" : "white";
    const borderWidth = isSelected ? 3 : 2.5;
    const shadow = isSelected
        ? "0 0 0 3px rgba(17,24,39,0.25), 0 4px 14px rgba(0,0,0,0.3)"
        : "0 2px 8px rgba(0,0,0,0.22)";
    const { bg: bgColor, text: textColor } = stringToHex(place.name);
    const initials = place.name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("");

    let badgeHtml = "";
    if (orderNumbers && orderNumbers.length > 0) {
        const label = orderNumbers.join(" · ");
        const multi = orderNumbers.length > 1;
        badgeHtml = `
            <span style="
                position: absolute; bottom: -4px; right: -4px;
                min-width: 18px; height: ${multi ? 16 : 18}px;
                border-radius: ${multi ? 8 : 9}px;
                padding: 0 ${multi ? 4 : 3}px;
                background: rgba(255, 255, 255, 0.94);
                border: 1.5px solid rgba(0, 0, 0, 0.15);
                box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18);
                display: flex; align-items: center; justify-content: center;
                font-size: ${multi ? 7.5 : 9}px; font-weight: 800; color: #111827;
                font-family: -apple-system, system-ui, sans-serif;
                line-height: 1; box-sizing: border-box; white-space: nowrap;
            ">
                ${label}
            </span>`;
    }

    const baseStyle = [
        `width: ${size}px`,
        `height: ${size}px`,
        "border-radius: 50%",
        `border: ${borderWidth}px solid ${borderColor}`,
        `box-shadow: ${shadow}`,
        `background: ${bgColor}`,
        "cursor: pointer",
        "flex-shrink: 0",
        "position: relative",
    ].join("; ");

    if (place.imageUrl) {
        return L.divIcon({
            className: "",
            html: `
                <div style="${baseStyle}; overflow: visible;">
                    <div style="width: 100%; height: 100%; border-radius: 50%; overflow: hidden;">
                        <img src="${escAttr(place.imageUrl)}" style="width: 100%; height: 100%; object-fit: cover;" />
                    </div>
                    ${badgeHtml}
                </div>`,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
            tooltipAnchor: [size / 2 + 6, 0],
        });
    }

    return L.divIcon({
        className: "",
        html: `
            <div style="${baseStyle}; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: ${isSelected ? 13 : 11}px; font-weight: 700; color: ${textColor}; line-height: 1; font-family: -apple-system, system-ui, sans-serif;">${initials || "?"}</span>
                ${badgeHtml}
            </div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        tooltipAnchor: [size / 2 + 6, 0],
    });
}

function SelectionController({
    places,
    selectedPlaceId,
}: {
    places: Doc<"place">[];
    selectedPlaceId: Id<"place">;
}) {
    const map = useMap();
    const prev = useRef<Id<"place"> | null>(null);

    useEffect(() => {
        if (selectedPlaceId && selectedPlaceId !== prev.current) {
            const selected = places.find((p) => p._id === selectedPlaceId);
            if (selected?.lat && selected?.lng)
                map.panTo([selected.lat, selected.lng], { animate: true });
        }
        prev.current = selectedPlaceId;
    }, [selectedPlaceId, places, map]);

    return null;
}

function MapController({
    center,
    zoom,
}: {
    center: [number, number];
    zoom: number;
}) {
    const map = useMap();
    const prevCenter = useRef(center);

    useEffect(() => {
        if (
            prevCenter.current[0] !== center[0] ||
            prevCenter.current[1] !== center[1]
        ) {
            map.setView(center, zoom);
            prevCenter.current = center;
        }
    }, [center, zoom, map]);

    return null;
}

function BoundsController({
    places,
    fitKey,
    paddingOpts,
}: {
    places: Doc<"place">[];
    fitKey: number;
    paddingOpts?: FitBoundsOptions;
}) {
    const map = useMap();
    const prevFitKey = useRef(-1);

    useEffect(() => {
        if (fitKey === prevFitKey.current) return;
        prevFitKey.current = fitKey;
        if (places.length === 0) return;

        try {
            const coords: LatLngTuple[] = places
                .filter((p) => p.lat && p.lng)
                .map((p) => [p.lat!, p.lng!] as LatLngTuple);
            const bounds = L.latLngBounds(coords);

            if (bounds.isValid()) {
                map.fitBounds(bounds, {
                    ...paddingOpts,
                    maxZoom: 16,
                    animate: true,
                });
            }
        } catch {
            console.error("Bounds error");
        }
    }, [fitKey, places, paddingOpts, map]);

    return null;
}

function MapClickHandler({
    onClick,
}: {
    onClick: LeafletMouseEventHandlerFn | null;
}) {
    const map = useMap();

    useEffect(() => {
        if (!onClick) return;

        map.on("click", onClick);

        return () => {
            map.off("click", onClick);
        };
    }, [map, onClick]);

    return null;
}

function MapContextMenuHandler({
    onContextMenu,
}: {
    onContextMenu: LeafletMouseEventHandlerFn | null;
}) {
    const map = useMap();

    useEffect(() => {
        if (!onContextMenu) return;

        map.on("contextmenu", onContextMenu);

        return () => {
            map.off("contextmenu", onContextMenu);
        };
    }, [map, onContextMenu]);

    return null;
}

interface RouteSegment {
    mid: [number, number];
    walkingText: string;
    drivingText: string;
}

function RouteLabel({ mid, walkingText, drivingText }: RouteSegment) {
    const map = useMap();
    const [visible, setVisible] = useState<boolean>(map.getZoom() >= 12);

    useEffect(() => {
        const check = () => setVisible(map.getZoom() >= 12);

        check();
        map.on("zoomend", check);

        return () => {
            map.off("zoomend", check);
        };
    }, [map]);

    if (!visible || !mid) return null;

    const icon = L.divIcon({
        className: "route-info-pill",
        html: `
            <div style="
                display: flex; align-items: center; gap: 5px;
                background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(8px);
                color: #fff; border-radius: 99px; padding: 3px 9px;
                font-size: 9px; font-weight: 600; white-space: nowrap;
                font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
                box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
                pointer-events: none;
                position: relative; left: -50%; top: -50%;
            ">
                <span style="display: flex; align-items: center; gap: 2px;">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="13" cy="4" r="2"/>
                        <path d="M7 21l3-7"/>
                        <path d="M10 14l5-5"/>
                        <path d="M15 9l-4 7"/>
                        <path d="M18 18l-3-7"/>
                    </svg>
                    ${walkingText}
                </span>
                <span style="opacity: 0.3;">|</span>
                <span style="display: flex; align-items: center; gap: 2px;">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-2-4H7L5 10l-2.5 1.1C1.7 11.3 1 12.1 1 13v3c0 .6.4 1 1 1h2"/>
                        <circle cx="7" cy="17" r="2"/>
                        <circle cx="17" cy="17" r="2"/>
                    </svg>
                    ${drivingText}
                </span>
            </div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
    });

    return (
        <Marker
            position={mid}
            icon={icon}
            interactive={false}
            zIndexOffset={2000}
        />
    );
}

interface MapViewProps {
    places?: Doc<"place">[];
    dayPlaces?: Doc<"place">[];
    route?: [number, number][] | null;
    routeSegments?: RouteSegment[];
    selectedPlaceId?: Id<"place"> | null;
    onMarkerClick?: (id: Id<"place">) => void;
    onMapClick?: ((e: L.LeafletMouseEvent) => void) | null;
    onMapContextMenu?: ((e: L.LeafletMouseEvent) => void) | null;
    center?: [number, number];
    zoom?: number;
    tileUrl?: string;
    fitKey?: number;
    dayOrderMap?: Record<string, number[]>;
    leftWidth?: number;
    rightWidth?: number;
    hasInspector?: boolean;
}

export function MapView({
    places = [],
    dayPlaces = [],
    route = null,
    routeSegments = [],
    selectedPlaceId = null,
    onMarkerClick,
    onMapClick,
    onMapContextMenu = null,
    center = [48.8566, 2.3522],
    zoom = 10,
    tileUrl,
    fitKey = 0,
    dayOrderMap = {},
    leftWidth = 0,
    rightWidth = 0,
    hasInspector = false,
}: MapViewProps) {
    const mapStyle = useAtomValue(mapStyleAtom);
    const resolvedTileUrl = tileUrl ?? MAP_TILE_URLS[mapStyle];
    const paddingOpts = useMemo<FitBoundsOptions>(() => {
        const isMobile =
            typeof window !== "undefined" && window.innerWidth < 768;
        if (isMobile) return { padding: [40, 20] as [number, number] };
        return {
            paddingTopLeft: [leftWidth + 40, 60] as [number, number],
            paddingBottomRight: [rightWidth + 40, hasInspector ? 320 : 60] as [
                number,
                number,
            ],
        };
    }, [leftWidth, rightWidth, hasInspector]);

    return (
        <MapContainer
            center={center}
            zoom={zoom}
            zoomControl={false}
            attributionControl={false}
            className="size-full bg-gray-200"
            minZoom={2}
            maxZoom={20}
            maxBounds={[
                [-90, -180],
                [90, 180],
            ]}
            maxBoundsViscosity={1.0}
            worldCopyJump
        >
            <TileLayer url={resolvedTileUrl} maxZoom={20} />

            <MapController center={center} zoom={zoom} />
            <BoundsController
                places={dayPlaces.length > 0 ? dayPlaces : places}
                fitKey={fitKey}
                paddingOpts={paddingOpts}
            />
            {selectedPlaceId && (
                <SelectionController
                    places={places}
                    selectedPlaceId={selectedPlaceId}
                />
            )}
            <MapClickHandler onClick={onMapClick ?? null} />
            <MapContextMenuHandler onContextMenu={onMapContextMenu} />

            <MarkerClusterGroup
                key={places.map((p) => p._id).join(",")}
                chunkedLoading
                maxClusterRadius={30}
                disableClusteringAtZoom={11}
                spiderfyOnMaxZoom
                showCoverageOnHover={false}
                zoomToBoundsOnClick
                iconCreateFunction={(cluster: {
                    getChildCount: () => number;
                }) => {
                    const count = cluster.getChildCount();
                    const size = count < 10 ? 36 : count < 50 ? 42 : 48;
                    return L.divIcon({
                        html: `
                            <div class="marker-cluster-custom" style="width: ${size}px; height: ${size}px;">
                                <span>${count}</span>
                            </div>`,
                        className: "marker-cluster-wrapper",
                        iconSize: L.point(size, size),
                    });
                }}
            >
                {places.map((place) => {
                    if (!place.lat || !place.lng) return null;
                    const isSelected = place._id === selectedPlaceId;
                    const orderNumbers = dayOrderMap[place._id] ?? null;
                    const icon = createPlaceIcon(
                        place,
                        orderNumbers,
                        isSelected
                    );

                    return (
                        <Marker
                            key={place._id}
                            position={[place.lat, place.lng]}
                            icon={icon}
                            eventHandlers={{
                                click: () => onMarkerClick?.(place._id),
                            }}
                            zIndexOffset={isSelected ? 1000 : 0}
                        >
                            <Tooltip
                                direction="right"
                                offset={[0, 0]}
                                opacity={1}
                                className="map-tooltip"
                            >
                                <TooltipContent place={place} />
                            </Tooltip>
                        </Marker>
                    );
                })}
            </MarkerClusterGroup>

            {route && route.length > 1 && (
                <>
                    <Polyline
                        positions={route}
                        color="#111827"
                        weight={3}
                        opacity={0.9}
                        dashArray="6, 5"
                    />
                    {routeSegments.map((seg, i) => (
                        <RouteLabel
                            key={i}
                            mid={seg.mid}
                            walkingText={seg.walkingText}
                            drivingText={seg.drivingText}
                        />
                    ))}
                </>
            )}
        </MapContainer>
    );
}

function TooltipContent({ place }: { place: Doc<"place"> }) {
    return (
        <div className="font-sans">
            <div className="text-xs font-semibold whitespace-nowrap text-gray-900">
                {place.name}
            </div>
            {place.address && (
                <div className="mt-0.5 max-w-48 overflow-hidden text-xs text-ellipsis whitespace-nowrap text-gray-400">
                    {place.address}
                </div>
            )}
        </div>
    );
}
