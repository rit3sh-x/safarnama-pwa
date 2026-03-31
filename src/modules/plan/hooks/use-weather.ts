import { useState, useEffect } from "react";
import { fetchWeather } from "../utils";
import type { WeatherData } from "../types";

export function useWeather(
    lat?: number | null,
    lng?: number | null,
    date?: string | null
) {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!lat || !lng || !date) return;

        let cancelled = false;

        fetchWeather(lat, lng, date).then(
            (result) => {
                if (!cancelled) {
                    setWeather(result);
                    setIsLoading(false);
                }
            },
            () => {
                if (!cancelled) {
                    setWeather(null);
                    setIsLoading(false);
                }
            }
        );

        return () => {
            cancelled = true;
        };
    }, [lat, lng, date]);

    return { weather, isLoading };
}
