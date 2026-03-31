import { atomWithStorage } from "jotai/utils";
import { DEFAULT_SETTINGS } from "./types";
import type { TemperatureUnit, TimeFormat } from "./types";

export const temperatureUnitAtom = atomWithStorage<TemperatureUnit>(
    "settings_temperature_unit",
    DEFAULT_SETTINGS.temperatureUnit
);

export const timeFormatAtom = atomWithStorage<TimeFormat>(
    "settings_time_format",
    DEFAULT_SETTINGS.timeFormat
);

export const showPlaceDescriptionAtom = atomWithStorage<boolean>(
    "settings_show_place_description",
    DEFAULT_SETTINGS.showPlaceDescription
);

export const defaultZoomAtom = atomWithStorage<number>(
    "settings_default_zoom",
    DEFAULT_SETTINGS.defaultZoom
);
