import { useCallback, useState } from "react";

export type TravelMode = "driving" | "walking" | "cycling";

export interface PathEntry {
    pathId: string;
    mode: TravelMode;
    placeIds: string[];
    coordinates: [number, number][];
    distanceMeters: number;
    durationSeconds: number;
    updatedAt: number;
}

interface OsrmRouteResponse {
    code: string;
    routes?: {
        geometry: { type: "LineString"; coordinates: [number, number][] };
        distance: number;
        duration: number;
    }[];
}

const PROFILE: Record<TravelMode, string> = {
    driving: "driving",
    walking: "foot",
    cycling: "bike",
};

export function buildPathId(mode: TravelMode, placeIds: string[]): string {
    return `${mode}:${placeIds.join("-")}`;
}

function reversePathId(pathId: string): string {
    const colon = pathId.indexOf(":");
    if (colon === -1) return pathId;
    const mode = pathId.slice(0, colon);
    const chain = pathId.slice(colon + 1).split("-");
    return `${mode}:${chain.reverse().join("-")}`;
}

type PathMap = Record<string, PathEntry>;

function pathsStorageKey(tripId: string): string {
    return `paths:${tripId}`;
}

function isValidEntry(v: unknown): v is PathEntry {
    if (!v || typeof v !== "object") return false;
    const e = v as Partial<PathEntry>;
    return (
        typeof e.pathId === "string" &&
        typeof e.mode === "string" &&
        Array.isArray(e.placeIds) &&
        Array.isArray(e.coordinates) &&
        typeof e.distanceMeters === "number" &&
        typeof e.durationSeconds === "number"
    );
}

function loadPathsMap(tripId: string): PathMap {
    if (typeof window === "undefined") return {};
    try {
        const raw = window.localStorage.getItem(pathsStorageKey(tripId));
        if (!raw) return {};
        const parsed = JSON.parse(raw) as unknown;
        if (!parsed || typeof parsed !== "object") return {};
        const out: PathMap = {};
        for (const [key, val] of Object.entries(parsed as PathMap)) {
            if (isValidEntry(val)) out[key] = val;
        }
        return out;
    } catch {
        return {};
    }
}

function writePathsMap(tripId: string, map: PathMap): void {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(
            pathsStorageKey(tripId),
            JSON.stringify(map)
        );
    } catch {
        // storage full or disabled — ignore
    }
}

export function loadAllPaths(tripId: string): PathEntry[] {
    return Object.values(loadPathsMap(tripId));
}

export function loadPath(tripId: string, pathId: string): PathEntry | null {
    const map = loadPathsMap(tripId);
    return map[pathId] ?? map[reversePathId(pathId)] ?? null;
}

export function savePath(tripId: string, entry: PathEntry): void {
    const map = loadPathsMap(tripId);
    delete map[reversePathId(entry.pathId)];
    map[entry.pathId] = entry;
    writePathsMap(tripId, map);
}

export function removePath(tripId: string, pathId: string): void {
    const map = loadPathsMap(tripId);
    let changed = false;
    if (pathId in map) {
        delete map[pathId];
        changed = true;
    }
    const rev = reversePathId(pathId);
    if (rev in map) {
        delete map[rev];
        changed = true;
    }
    if (changed) writePathsMap(tripId, map);
}

export function formatDistance(meters: number): string {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(meters < 10_000 ? 1 : 0)} km`;
}

export function formatDuration(seconds: number): string {
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function useRoutePlanner() {
    const [result, setResult] = useState<PathEntry | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchRoute = useCallback(
        async (
            waypoints: [number, number][],
            mode: TravelMode,
            tripId: string,
            placeIds: string[]
        ): Promise<PathEntry | null> => {
            if (waypoints.length < 2) {
                setError("Need at least a start and an end.");
                return null;
            }
            const uniqueCount = new Set(
                waypoints.map(([lng, lat]) => `${lng},${lat}`)
            ).size;
            if (uniqueCount < 2) {
                setError("Start and end must be different places.");
                return null;
            }

            const pathId = buildPathId(mode, placeIds);

            const cached = loadPath(tripId, pathId);
            if (cached) {
                setResult(cached);
                setError(null);
                return cached;
            }

            setIsLoading(true);
            setError(null);
            try {
                const path = waypoints
                    .map(([lng, lat]) => `${lng},${lat}`)
                    .join(";");
                const url = `https://router.project-osrm.org/route/v1/${PROFILE[mode]}/${path}?overview=full&geometries=geojson`;
                const res = await fetch(url);
                if (!res.ok) throw new Error(`Routing failed (${res.status})`);
                const data = (await res.json()) as OsrmRouteResponse;
                if (data.code !== "Ok" || !data.routes?.[0]) {
                    throw new Error("No route found");
                }
                const route = data.routes[0];
                const entry: PathEntry = {
                    pathId,
                    mode,
                    placeIds,
                    coordinates: route.geometry.coordinates,
                    distanceMeters: route.distance,
                    durationSeconds: route.duration,
                    updatedAt: Date.now(),
                };
                setResult(entry);
                savePath(tripId, entry);
                return entry;
            } catch (err) {
                const msg =
                    err instanceof Error ? err.message : "Routing failed";
                setError(msg);
                setResult(null);
                return null;
            } finally {
                setIsLoading(false);
            }
        },
        []
    );

    const clear = useCallback(() => {
        setResult(null);
        setError(null);
    }, []);

    return { result, isLoading, error, fetchRoute, clear };
}
