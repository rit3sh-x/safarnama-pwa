export type TemperatureUnit = "celsius" | "fahrenheit";
export type TimeFormat = "12h" | "24h";

export interface UserSettings {
    temperatureUnit: TemperatureUnit;
    timeFormat: TimeFormat;
    showPlaceDescription: boolean;
    defaultZoom: number;
}

export const DEFAULT_SETTINGS: UserSettings = {
    temperatureUnit: "celsius",
    timeFormat: "12h",
    showPlaceDescription: false,
    defaultZoom: 10,
};
