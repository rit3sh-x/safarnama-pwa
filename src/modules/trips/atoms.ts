import { atom } from "jotai";
import type { Id } from "@backend/dataModel";
import type { NavOption, SelectedTrip, TripPanelView } from "./types";

export const searchMapAtom = atom<Record<NavOption, string | undefined>>({
    trips: undefined,
    invites: undefined,
    public_trips: undefined,
});
export const navOptionsAtom = atom<NavOption>("trips");

export const selectedTripAtom = atom<SelectedTrip | null>(null);
export const tripPanelViewAtom = atom<TripPanelView>("chat");
export const publicTripPreviewAtom = atom<Id<"trip"> | null>(null);
