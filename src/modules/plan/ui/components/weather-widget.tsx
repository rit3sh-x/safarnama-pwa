import {
    Sun,
    Cloud,
    CloudRain,
    CloudSnow,
    CloudDrizzle,
    CloudLightning,
    Wind,
    Droplets,
    Sunrise,
    Sunset,
} from "lucide-react";
import { useWeather } from "../../hooks/use-weather";
import { cn } from "@/lib/utils";
import { useSettings } from "@/modules/settings/hooks/use-settings";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { LucideIcon } from "lucide-react";

const WEATHER_ICON_MAP: Record<string, LucideIcon> = {
    Clear: Sun,
    Clouds: Cloud,
    Rain: CloudRain,
    Drizzle: CloudDrizzle,
    Thunderstorm: CloudLightning,
    Snow: CloudSnow,
    Fog: Wind,
    Mist: Wind,
    Haze: Wind,
};

function WeatherIcon({
    main,
    className,
}: {
    main: string;
    className?: string;
}) {
    const Icon = WEATHER_ICON_MAP[main] || Cloud;
    return <Icon className={className} strokeWidth={1.8} />;
}

function convertTemp(celsius: number, toFahrenheit: boolean): number {
    return Math.round(toFahrenheit ? (celsius * 9) / 5 + 32 : celsius);
}

interface WeatherWidgetProps {
    lat: number;
    lng: number;
    date?: string;
    compact?: boolean;
}

export function WeatherWidget({
    lat,
    lng,
    date,
    compact = false,
}: WeatherWidgetProps) {
    const { temperatureUnit } = useSettings();
    const isFahrenheit = temperatureUnit === "fahrenheit";
    const unit = isFahrenheit ? "°F" : "°C";
    const { weather, isLoading } = useWeather(lat, lng, date);

    if (isLoading) {
        return compact ? (
            <Skeleton className="h-4 w-16" />
        ) : (
            <WeatherSkeleton />
        );
    }

    if (!weather) return null;

    const temp = convertTemp(weather.temp, isFahrenheit);
    const isClimate = weather.type === "climate";

    if (compact) {
        return (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <WeatherIcon main={weather.main} className="size-3" />
                <span>
                    {isClimate && "Ø "}
                    {temp}
                    {unit}
                </span>
            </span>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <WeatherIcon main={weather.main} className="size-5" />
                </div>
                <div>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-lg leading-none font-bold">
                            {isClimate && "Ø "}
                            {temp}
                            {unit}
                        </span>
                        {weather.tempMin != null && weather.tempMax != null && (
                            <span className="text-xs text-muted-foreground">
                                {convertTemp(weather.tempMin, isFahrenheit)}° /{" "}
                                {convertTemp(weather.tempMax, isFahrenheit)}°
                            </span>
                        )}
                    </div>
                    {weather.description && (
                        <p className="text-xs text-muted-foreground capitalize">
                            {weather.description}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap gap-1">
                {weather.precipitationProbabilityMax != null &&
                    weather.precipitationProbabilityMax > 0 && (
                        <Badge
                            variant="secondary"
                            className="gap-1 px-1.5 py-0 text-xs"
                        >
                            <Droplets className="size-3" />
                            {weather.precipitationProbabilityMax}%
                        </Badge>
                    )}
                {weather.windMax != null && weather.windMax > 0 && (
                    <Badge
                        variant="secondary"
                        className="gap-1 px-1.5 py-0 text-xs"
                    >
                        <Wind className="size-3" />
                        {isFahrenheit
                            ? `${Math.round(weather.windMax * 0.621)} mph`
                            : `${weather.windMax} km/h`}
                    </Badge>
                )}
                {weather.sunrise && (
                    <Badge
                        variant="secondary"
                        className="gap-1 px-1.5 py-0 text-xs"
                    >
                        <Sunrise className="size-3" />
                        {weather.sunrise}
                    </Badge>
                )}
                {weather.sunset && (
                    <Badge
                        variant="secondary"
                        className="gap-1 px-1.5 py-0 text-xs"
                    >
                        <Sunset className="size-3" />
                        {weather.sunset}
                    </Badge>
                )}
            </div>

            {weather.hourly && weather.hourly.length > 0 && (
                <div className="scrollbar-none -mx-1 overflow-x-auto px-1">
                    <div className="inline-flex gap-1">
                        {weather.hourly
                            .filter((_, i) => i % 2 === 0)
                            .map((h) => (
                                <div
                                    key={h.hour}
                                    className={cn(
                                        "flex w-10 flex-col items-center gap-1 rounded-md py-1",
                                        h.precipitationProbability > 50 &&
                                            "bg-blue-500/5"
                                    )}
                                >
                                    <span className="text-xs text-muted-foreground">
                                        {String(h.hour).padStart(2, "0")}
                                    </span>
                                    <WeatherIcon
                                        main={h.main}
                                        className="size-3"
                                    />
                                    <span className="text-xs font-semibold">
                                        {convertTemp(h.temp, isFahrenheit)}°
                                    </span>
                                    {h.precipitationProbability > 0 && (
                                        <span className="text-xs text-blue-500">
                                            {h.precipitationProbability}%
                                        </span>
                                    )}
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {isClimate && (
                <p className="text-xs text-muted-foreground italic">
                    Based on historical averages
                </p>
            )}
        </div>
    );
}

function WeatherSkeleton() {
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2.5">
                <Skeleton className="size-9 rounded-lg" />
                <div className="space-y-1.5">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-3 w-28" />
                </div>
            </div>
            <div className="flex gap-1">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-12 rounded-full" />
            </div>
            <div className="flex gap-1">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-10 rounded-md" />
                ))}
            </div>
        </div>
    );
}
