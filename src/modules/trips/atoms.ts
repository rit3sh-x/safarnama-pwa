import { atomWithStorage } from "jotai/utils";
import type { Id } from "@backend/dataModel";
import type { NavOption, SelectedTrip, TripPanelView } from "./types";
import { TRIPS_STORAGE_KEYS } from "./constants";

const TRIPS_SEARCH_DEFAULT: Record<NavOption, string | undefined> = {
    trips: undefined,
    invites: undefined,
    public_trips: undefined,
};

export const searchMapAtom = atomWithStorage<
    Record<NavOption, string | undefined>
>(TRIPS_STORAGE_KEYS.searchMap, TRIPS_SEARCH_DEFAULT);

export const navOptionsAtom = atomWithStorage<NavOption>(
    TRIPS_STORAGE_KEYS.navOption,
    "trips"
);

export const selectedTripAtom = atomWithStorage<SelectedTrip | null>(
    TRIPS_STORAGE_KEYS.selectedTrip,
    null
);

export const tripPanelViewAtom = atomWithStorage<TripPanelView>(
    TRIPS_STORAGE_KEYS.panelView,
    "chat"
);

export const publicTripPreviewAtom = atomWithStorage<Id<"trip"> | null>(
    TRIPS_STORAGE_KEYS.publicPreview,
    null
);
