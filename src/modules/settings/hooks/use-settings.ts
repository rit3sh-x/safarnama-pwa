import { useAtom } from "jotai";
import {
    temperatureUnitAtom,
    timeFormatAtom,
    showPlaceDescriptionAtom,
    defaultZoomAtom,
} from "../atoms";

export function useSettings() {
    const [temperatureUnit, setTemperatureUnit] = useAtom(temperatureUnitAtom);
    const [timeFormat, setTimeFormat] = useAtom(timeFormatAtom);
    const [showPlaceDescription, setShowPlaceDescription] = useAtom(
        showPlaceDescriptionAtom
    );
    const [defaultZoom, setDefaultZoom] = useAtom(defaultZoomAtom);

    return {
        temperatureUnit,
        setTemperatureUnit,
        timeFormat,
        setTimeFormat,
        showPlaceDescription,
        setShowPlaceDescription,
        defaultZoom,
        setDefaultZoom,
    };
}
