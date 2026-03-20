import { atom } from "jotai"
import type { NavOption, SelectedTrip } from "./types"

export const searchMapAtom = atom<Record<NavOption, string | undefined>>({
  trips: undefined,
  invites: undefined,
  public_trips: undefined,
})
export const navOptionsAtom = atom<NavOption>("trips")

export const selectedTripAtom = atom<SelectedTrip | null>(null)
