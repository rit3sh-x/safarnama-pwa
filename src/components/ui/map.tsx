import L from "leaflet";
import {
    createContext,
    forwardRef,
    useCallback,
    useContext,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Locate, Minus, Plus } from "lucide-react";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";

// --- Tile sources ------------------------------------------------------------

const defaultTileUrls = {
    light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    satellite:
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
};

type MapStyle = "standard" | "satellite";

// --- Theme -------------------------------------------------------------------

type Theme = "light" | "dark";

function getDocumentTheme(): Theme {
    if (typeof document === "undefined") return "light";
    return document.documentElement.classList.contains("dark")
        ? "dark"
        : "light";
}

function useResolvedTheme(themeProp?: Theme): Theme {
    const { theme } = useTheme();
    const [resolvedTheme, setResolvedTheme] = useState<Theme>(getDocumentTheme);

    useEffect(() => {
        if (themeProp || typeof document === "undefined") return;
        const sync = () => setResolvedTheme(getDocumentTheme());
        sync();
        const observer = new MutationObserver(sync);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });
        return () => observer.disconnect();
    }, [themeProp, theme]);

    if (themeProp) return themeProp;
    if (theme === "light" || theme === "dark") return theme;
    return resolvedTheme;
}

// --- Context -----------------------------------------------------------------

type MapContextValue = {
    map: L.Map | null;
    isLoaded: boolean;
};

const MapContext = createContext<MapContextValue | null>(null);

function useMap() {
    const ctx = useContext(MapContext);
    if (!ctx) {
        throw new Error("useMap must be used within a Map component");
    }
    return ctx;
}

// --- Public types ------------------------------------------------------------

/** Map viewport state. Coordinates are [longitude, latitude]. */
type MapViewport = {
    /** [longitude, latitude] */
    center: [number, number];
    zoom: number;
    /** Kept for API parity; Leaflet does not rotate. */
    bearing: number;
    /** Kept for API parity; Leaflet does not pitch. */
    pitch: number;
};

type MapRef = L.Map;

type MapProps = {
    children?: ReactNode;
    className?: string;
    /** Theme override. If omitted, follows the document's `dark` class. */
    theme?: Theme;
    /** Custom raster tile URL templates per theme. */
    styles?: {
        light?: string;
        dark?: string;
        satellite?: string;
    };
    /** Map style. "satellite" uses imagery and ignores theme. Default "standard". */
    mapStyle?: MapStyle;
    /** Initial center as [longitude, latitude]. */
    center?: [number, number];
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    /** Controlled viewport (use with `onViewportChange`). */
    viewport?: Partial<MapViewport>;
    /** Fires on every move/zoom; pair with `viewport` for controlled mode. */
    onViewportChange?: (vp: MapViewport) => void;
    /** Show a loading overlay. */
    loading?: boolean;
};

// --- Loader ------------------------------------------------------------------

function DefaultLoader() {
    return (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-xs">
            <div className="flex gap-1">
                <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground/60" />
                <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground/60 [animation-delay:150ms]" />
                <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground/60 [animation-delay:300ms]" />
            </div>
        </div>
    );
}

// --- Helpers -----------------------------------------------------------------

function getViewport(map: L.Map): MapViewport {
    const c = map.getCenter();
    return {
        center: [c.lng, c.lat],
        zoom: map.getZoom(),
        bearing: 0,
        pitch: 0,
    };
}

// --- Map ---------------------------------------------------------------------

const Map = forwardRef<MapRef, MapProps>(function Map(
    {
        children,
        className,
        theme: themeProp,
        styles,
        mapStyle = "standard",
        center = [0, 0],
        zoom = 2,
        minZoom = 2,
        maxZoom = 19,
        viewport,
        onViewportChange,
        loading = false,
    },
    ref
) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const tileLayerRef = useRef<L.TileLayer | null>(null);
    const internalUpdateRef = useRef(false);
    const resolvedTheme = useResolvedTheme(themeProp);

    const isControlled =
        viewport !== undefined && onViewportChange !== undefined;

    const onViewportChangeRef = useRef(onViewportChange);
    useEffect(() => {
        onViewportChangeRef.current = onViewportChange;
    }, [onViewportChange]);

    const tileUrls = useMemo(
        () => ({
            light: styles?.light ?? defaultTileUrls.light,
            dark: styles?.dark ?? defaultTileUrls.dark,
            satellite: styles?.satellite ?? defaultTileUrls.satellite,
        }),
        [styles]
    );

    const activeTileUrl =
        mapStyle === "satellite" ? tileUrls.satellite : tileUrls[resolvedTheme];

    useImperativeHandle(ref, () => mapInstance as L.Map, [mapInstance]);

    // Initialize once
    useEffect(() => {
        if (!containerRef.current) return;

        const initialCenter = viewport?.center ?? center;
        const initialZoom = viewport?.zoom ?? zoom;

        const map = L.map(containerRef.current, {
            center: [initialCenter[1], initialCenter[0]],
            zoom: initialZoom,
            minZoom,
            maxZoom,
            zoomControl: false,
            attributionControl: false,
            worldCopyJump: true,
        });

        const tile = L.tileLayer(activeTileUrl, {
            subdomains: "abcd",
            maxZoom,
            crossOrigin: true,
        });
        tile.addTo(map);
        tileLayerRef.current = tile;

        const handleMove = () => {
            if (internalUpdateRef.current) return;
            onViewportChangeRef.current?.(getViewport(map));
        };
        map.on("moveend", handleMove);
        map.on("zoomend", handleMove);

        map.whenReady(() => setIsLoaded(true));
        setMapInstance(map);

        return () => {
            map.off("moveend", handleMove);
            map.off("zoomend", handleMove);
            map.remove();
            tileLayerRef.current = null;
            setMapInstance(null);
            setIsLoaded(false);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Swap tiles when theme or map style changes
    useEffect(() => {
        if (!mapInstance || !tileLayerRef.current) return;
        tileLayerRef.current.setUrl(activeTileUrl);
    }, [mapInstance, activeTileUrl]);

    // Update zoom bounds reactively
    useEffect(() => {
        if (!mapInstance) return;
        mapInstance.setMinZoom(minZoom);
        mapInstance.setMaxZoom(maxZoom);
    }, [mapInstance, minZoom, maxZoom]);

    // Controlled viewport sync
    useEffect(() => {
        if (!mapInstance || !isControlled || !viewport) return;
        const current = mapInstance.getCenter();
        const target = viewport.center ?? [current.lng, current.lat];
        const targetZoom = viewport.zoom ?? mapInstance.getZoom();
        const sameCenter =
            Math.abs(target[0] - current.lng) < 1e-9 &&
            Math.abs(target[1] - current.lat) < 1e-9;
        const sameZoom = Math.abs(targetZoom - mapInstance.getZoom()) < 1e-9;
        if (sameCenter && sameZoom) return;

        internalUpdateRef.current = true;
        mapInstance.setView([target[1], target[0]], targetZoom, {
            animate: false,
        });
        // release on next tick after move events fire
        const t = setTimeout(() => {
            internalUpdateRef.current = false;
        }, 0);
        return () => clearTimeout(t);
    }, [mapInstance, isControlled, viewport]);

    const contextValue = useMemo<MapContextValue>(
        () => ({ map: mapInstance, isLoaded }),
        [mapInstance, isLoaded]
    );

    return (
        <MapContext.Provider value={contextValue}>
            <div className={cn("relative", className)}>
                <div ref={containerRef} className="absolute inset-0" />
                {(loading || !isLoaded) && <DefaultLoader />}
                {mapInstance && children}
            </div>
        </MapContext.Provider>
    );
});

// --- Marker context ----------------------------------------------------------

type MarkerContextValue = {
    marker: L.Marker | null;
    /** The DOM element rendered inside the marker icon. */
    contentEl: HTMLDivElement | null;
};

const MarkerContext = createContext<MarkerContextValue | null>(null);

function useMarkerContext() {
    const ctx = useContext(MarkerContext);
    if (!ctx) {
        throw new Error("Marker subcomponents must be used inside <MapMarker>");
    }
    return ctx;
}

// --- MapMarker ---------------------------------------------------------------

type MapMarkerProps = {
    longitude: number;
    latitude: number;
    onClick?: () => void;
    /** Pixel anchor offset relative to the icon center. */
    anchor?: [number, number];
    children?: ReactNode;
};

function MapMarker({
    longitude,
    latitude,
    onClick,
    anchor,
    children,
}: MapMarkerProps) {
    const { map } = useMap();
    const [contentEl] = useState(() => {
        if (typeof document === "undefined") return null;
        const el = document.createElement("div");
        el.className = "leaflet-react-marker";
        return el;
    });
    const [marker, setMarker] = useState<L.Marker | null>(null);
    const onClickRef = useRef(onClick);
    useEffect(() => {
        onClickRef.current = onClick;
    }, [onClick]);

    // Create marker once map is ready
    useEffect(() => {
        if (!map || !contentEl) return;

        const icon = L.divIcon({
            html: contentEl,
            className: "!bg-transparent !border-0 !p-0",
            iconSize: [0, 0],
            iconAnchor: anchor ?? [0, 0],
        });

        const m = L.marker([latitude, longitude], { icon, riseOnHover: true });
        m.addTo(map);
        m.on("click", (e) => {
            L.DomEvent.stopPropagation(e);
            onClickRef.current?.();
        });

        setMarker(m);

        return () => {
            m.remove();
            setMarker(null);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, contentEl]);

    // Update position
    useEffect(() => {
        if (!marker) return;
        marker.setLatLng([latitude, longitude]);
    }, [marker, latitude, longitude]);

    const value = useMemo<MarkerContextValue>(
        () => ({ marker, contentEl }),
        [marker, contentEl]
    );

    return (
        <MarkerContext.Provider value={value}>
            {children}
        </MarkerContext.Provider>
    );
}

// --- MarkerContent (custom HTML body for the marker) ------------------------

function MarkerContent({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    const { contentEl } = useMarkerContext();
    if (!contentEl) return null;
    return createPortal(
        <div className={cn("relative", className)}>{children}</div>,
        contentEl
    );
}

// --- MarkerTooltip (hover tooltip on a marker) ------------------------------

function MarkerTooltip({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    const { marker } = useMarkerContext();
    const [tipEl] = useState(() =>
        typeof document !== "undefined" ? document.createElement("div") : null
    );

    useEffect(() => {
        if (!marker || !tipEl) return;
        marker.bindTooltip(tipEl, {
            direction: "top",
            offset: L.point(0, -8),
            opacity: 1,
            className: cn(
                "rounded-md border border-border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-sm",
                className
            ),
        });
        return () => {
            marker.unbindTooltip();
        };
    }, [marker, tipEl, className]);

    if (!tipEl) return null;
    return createPortal(<>{children}</>, tipEl);
}

// --- MarkerLabel (always-visible label) -------------------------------------

function MarkerLabel({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    const { marker } = useMarkerContext();
    const [el] = useState(() =>
        typeof document !== "undefined" ? document.createElement("div") : null
    );

    useEffect(() => {
        if (!marker || !el) return;
        marker.bindTooltip(el, {
            permanent: true,
            direction: "right",
            offset: L.point(8, 0),
            className: cn(
                "rounded border border-border bg-background px-1.5 py-0.5 text-xs shadow",
                className
            ),
        });
        return () => {
            marker.unbindTooltip();
        };
    }, [marker, el, className]);

    if (!el) return null;
    return createPortal(<>{children}</>, el);
}

// --- MarkerPopup (click popup on a marker) ----------------------------------

function MarkerPopup({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    const { marker } = useMarkerContext();
    const [el] = useState(() =>
        typeof document !== "undefined" ? document.createElement("div") : null
    );

    useEffect(() => {
        if (!marker || !el) return;
        marker.bindPopup(el, {
            className: cn("safarnama-popup", className),
            closeButton: false,
        });
        return () => {
            marker.unbindPopup();
        };
    }, [marker, el, className]);

    if (!el) return null;
    return createPortal(<>{children}</>, el);
}

// --- MapPopup (free-floating popup at coordinates) --------------------------

function MapPopup({
    longitude,
    latitude,
    onClose,
    children,
    className,
}: {
    longitude: number;
    latitude: number;
    onClose?: () => void;
    children: ReactNode;
    className?: string;
}) {
    const { map } = useMap();
    const [el] = useState(() =>
        typeof document !== "undefined" ? document.createElement("div") : null
    );
    const onCloseRef = useRef(onClose);
    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        if (!map || !el) return;
        const popup = L.popup({
            className: cn("safarnama-popup", className),
            closeButton: false,
            maxWidth: 400,
        })
            .setLatLng([latitude, longitude])
            .setContent(el)
            .openOn(map);

        const handleClose = () => onCloseRef.current?.();
        popup.on("remove", handleClose);

        return () => {
            popup.off("remove", handleClose);
            map.closePopup(popup);
        };
    }, [map, el, latitude, longitude, className]);

    if (!el) return null;
    return createPortal(<>{children}</>, el);
}

// --- MapControls -------------------------------------------------------------

function MapControls({ className }: { className?: string }) {
    const { map } = useMap();

    const handleLocate = useCallback(() => {
        if (!map || !navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition((pos) => {
            map.flyTo([pos.coords.latitude, pos.coords.longitude], 14);
        });
    }, [map]);

    if (!map) return null;

    const btn =
        "flex size-9 items-center justify-center rounded-md border border-border bg-background shadow-sm transition-colors hover:bg-muted";

    return (
        <div
            className={cn(
                "absolute top-2 right-2 z-10 flex flex-col gap-1",
                className
            )}
        >
            <button
                type="button"
                onClick={() => map.zoomIn()}
                className={btn}
                aria-label="Zoom in"
            >
                <Plus className="size-4" />
            </button>
            <button
                type="button"
                onClick={() => map.zoomOut()}
                className={btn}
                aria-label="Zoom out"
            >
                <Minus className="size-4" />
            </button>
            <button
                type="button"
                onClick={handleLocate}
                className={btn}
                aria-label="My location"
            >
                <Locate className="size-4" />
            </button>
        </div>
    );
}

// --- MapRoute (polyline) -----------------------------------------------------

type MapRouteProps = {
    /** Coordinates as [longitude, latitude] pairs. */
    coordinates: [number, number][];
    color?: string;
    width?: number;
    opacity?: number;
    /** Dash array (Leaflet expects a comma string; pass numbers and we'll join). */
    dashArray?: number[];
    /** Click handler. When provided the polyline becomes interactive. */
    onClick?: (e: { lat: number; lng: number }) => void;
};

function MapRoute({
    coordinates,
    color = "#3b82f6",
    width = 4,
    opacity = 1,
    dashArray,
    onClick,
}: MapRouteProps) {
    const { map } = useMap();
    const polylineRef = useRef<L.Polyline | null>(null);
    const onClickRef = useRef(onClick);
    useEffect(() => {
        onClickRef.current = onClick;
    }, [onClick]);

    useEffect(() => {
        if (!map) return;
        const latlngs = coordinates.map(
            ([lng, lat]) => [lat, lng] as L.LatLngTuple
        );
        const polyline = L.polyline(latlngs, {
            color,
            weight: width,
            opacity,
            dashArray: dashArray ? dashArray.join(",") : undefined,
            interactive: !!onClickRef.current,
        });

        const handleClick = (ev: L.LeafletMouseEvent) => {
            L.DomEvent.stopPropagation(ev);
            onClickRef.current?.({
                lat: ev.latlng.lat,
                lng: ev.latlng.lng,
            });
        };

        if (onClickRef.current) {
            polyline.on("click", handleClick);
        }

        polyline.addTo(map);
        polylineRef.current = polyline;

        return () => {
            polyline.off("click", handleClick);
            polyline.remove();
            polylineRef.current = null;
        };
    }, [map, coordinates, color, width, opacity, dashArray]);

    return null;
}

// --- MapClusterLayer (uses leaflet.markercluster) ---------------------------

type ClusterPoint = {
    id: string | number;
    longitude: number;
    latitude: number;
};

type MapClusterLayerProps = {
    points: ClusterPoint[];
    onPointClick?: (id: string | number) => void;
    /** Max radius in pixels. Default 80. */
    maxClusterRadius?: number;
};

function MapClusterLayer({
    points,
    onPointClick,
    maxClusterRadius = 80,
}: MapClusterLayerProps) {
    const { map } = useMap();
    const onClickRef = useRef(onPointClick);
    useEffect(() => {
        onClickRef.current = onPointClick;
    }, [onPointClick]);

    useEffect(() => {
        if (!map) return;
        // L.markerClusterGroup is added by the side-effect import at the top.
        const group = (
            L as unknown as {
                markerClusterGroup: (
                    options?: Record<string, unknown>
                ) => L.LayerGroup;
            }
        ).markerClusterGroup({
            maxClusterRadius,
            showCoverageOnHover: false,
            spiderfyOnMaxZoom: true,
            chunkedLoading: true,
        });

        for (const p of points) {
            const m = L.marker([p.latitude, p.longitude]);
            m.on("click", () => onClickRef.current?.(p.id));
            (group as unknown as L.LayerGroup).addLayer(m);
        }

        (group as unknown as L.Layer).addTo(map);

        return () => {
            (group as unknown as L.Layer).remove();
        };
    }, [map, points, maxClusterRadius]);

    return null;
}

export {
    Map,
    useMap,
    MapMarker,
    MarkerContent,
    MarkerPopup,
    MarkerTooltip,
    MarkerLabel,
    MapPopup,
    MapControls,
    MapRoute,
    MapClusterLayer,
};

export type { MapRef, MapViewport };
