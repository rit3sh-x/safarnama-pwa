export type TemperatureUnit = "celsius" | "fahrenheit";
export type TimeFormat = "12h" | "24h";
export type MapStyle = "standard" | "satellite";

export interface UserSettings {
    temperatureUnit: TemperatureUnit;
    timeFormat: TimeFormat;
    showPlaceDescription: boolean;
    defaultZoom: number;
    mapStyle: MapStyle;
}

export const DEFAULT_SETTINGS: UserSettings = {
    temperatureUnit: "celsius",
    timeFormat: "12h",
    showPlaceDescription: false,
    defaultZoom: 10,
    mapStyle: "standard",
};

export const MAP_TILE_URLS: Record<MapStyle, string> = {
    standard: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    satellite:
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
};
