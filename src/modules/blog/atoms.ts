import { atom } from "jotai";

export const blogSearchAtom = atom<string | undefined>(undefined);

export type BlogFilters = {
    tags: string[];
    minBudget?: number;
    maxBudget?: number;
    minDays?: number;
    maxDays?: number;
    nearMe?: { lat: number; lng: number; radiusKm: number };
};

export const blogFiltersAtom = atom<BlogFilters>({ tags: [] });
