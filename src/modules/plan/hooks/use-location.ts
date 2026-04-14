import { useEffect, useState } from "react";

export type LocationCoordinates = {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude: number | null;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
    timestamp: number;
};

export type LocationState = {
    coords: LocationCoordinates | null;
    error: GeolocationPositionError | null;
    isLoading: boolean;
    isSupported: boolean;
};

const DEFAULT_OPTIONS: PositionOptions = {
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: 10_000,
};

const HIGH_ACCURACY_MAX_METERS = 100;

const IS_SUPPORTED =
    typeof window !== "undefined" && "geolocation" in navigator;

function toLocationCoordinates(pos: GeolocationPosition): LocationCoordinates {
    const {
        latitude,
        longitude,
        accuracy,
        altitude,
        altitudeAccuracy,
        heading,
        speed,
    } = pos.coords;
    return {
        latitude,
        longitude,
        accuracy,
        altitude,
        altitudeAccuracy,
        heading,
        speed,
        timestamp: pos.timestamp,
    };
}

export function useLocation(options?: PositionOptions): LocationState {
    const [coords, setCoords] = useState<LocationCoordinates | null>(null);
    const [error, setError] = useState<GeolocationPositionError | null>(null);
    const [permissionDenied, setPermissionDenied] = useState(false);

    useEffect(() => {
        if (!IS_SUPPORTED) return;

        const handleSuccess = (pos: GeolocationPosition) => {
            if (pos.coords.accuracy > HIGH_ACCURACY_MAX_METERS) {
                setPermissionDenied(true);
                setCoords(null);
                return;
            }
            setPermissionDenied(false);
            setError(null);
            setCoords(toLocationCoordinates(pos));
        };

        const handleError = (err: GeolocationPositionError) => {
            if (err.code === err.PERMISSION_DENIED) {
                setPermissionDenied(true);
                setCoords(null);
            }
            setError(err);
        };

        const watchId = navigator.geolocation.watchPosition(
            handleSuccess,
            handleError,
            {
                enableHighAccuracy:
                    options?.enableHighAccuracy ??
                    DEFAULT_OPTIONS.enableHighAccuracy,
                maximumAge: options?.maximumAge ?? DEFAULT_OPTIONS.maximumAge,
                timeout: options?.timeout ?? DEFAULT_OPTIONS.timeout,
            }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [options?.enableHighAccuracy, options?.maximumAge, options?.timeout]);

    const isSupported = IS_SUPPORTED && !permissionDenied;
    const isLoading = isSupported && coords === null && error === null;

    return { coords, error, isLoading, isSupported };
}
