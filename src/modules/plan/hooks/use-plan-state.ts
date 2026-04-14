import { useCallback, useState } from "react";
import type { Doc, Id } from "@backend/dataModel";

export interface PrefillCoords {
    lat: number;
    lng: number;
    name?: string;
    address?: string;
}

export function usePlanState() {
    const [selectedDayId, setSelectedDayId] = useState<Id<"day"> | null>(null);
    const [selectedPlaceId, setSelectedPlaceId] = useState<Id<"place"> | null>(
        null
    );
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

    const [fitKey, setFitKey] = useState(0);
    const [pinMode, setPinMode] = useState(false);
    const [showPlaceForm, setShowPlaceForm] = useState(false);
    const [editingPlace, setEditingPlace] = useState<Doc<"place"> | null>(null);
    const [prefillCoords, setPrefillCoords] = useState<PrefillCoords | null>(
        null
    );
    const [showRoutePlanner, setShowRoutePlanner] = useState(false);

    const refitBounds = useCallback(() => setFitKey((k) => k + 1), []);

    const handleSelectDay = useCallback((dayId: Id<"day">) => {
        setSelectedDayId((prev) => {
            if (prev !== dayId) setFitKey((k) => k + 1);
            return dayId;
        });
        setMobileSheetOpen(false);
    }, []);

    const handleSelectPlace = useCallback((placeId: Id<"place"> | null) => {
        setSelectedPlaceId(placeId);
    }, []);

    const handleMarkerClick = useCallback((placeId: Id<"place">) => {
        setSelectedPlaceId((prev) => (prev === placeId ? null : placeId));
    }, []);

    const openPlaceForm = useCallback(
        (opts?: {
            place?: Doc<"place"> | null;
            prefill?: PrefillCoords | null;
        }) => {
            setEditingPlace(opts?.place ?? null);
            setPrefillCoords(opts?.prefill ?? null);
            setShowPlaceForm(true);
        },
        []
    );

    const closePlaceForm = useCallback(() => {
        setShowPlaceForm(false);
        setEditingPlace(null);
        setPrefillCoords(null);
        setPinMode(false);
    }, []);

    return {
        selectedDayId,
        setSelectedDayId,
        selectedPlaceId,
        setSelectedPlaceId,
        sidebarCollapsed,
        setSidebarCollapsed,
        mobileSheetOpen,
        setMobileSheetOpen,
        fitKey,
        refitBounds,
        pinMode,
        setPinMode,
        showPlaceForm,
        setShowPlaceForm,
        editingPlace,
        prefillCoords,
        setPrefillCoords,
        showRoutePlanner,
        setShowRoutePlanner,
        handleSelectDay,
        handleSelectPlace,
        handleMarkerClick,
        openPlaceForm,
        closePlaceForm,
    };
}
