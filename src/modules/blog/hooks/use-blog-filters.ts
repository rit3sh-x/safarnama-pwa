import { useAtomValue } from "jotai";
import { blogFiltersAtom } from "../atoms";

export function useBlogFilterActiveCount() {
    const filters = useAtomValue(blogFiltersAtom);
    return (
        filters.tags.length +
        (filters.minBudget || filters.maxBudget ? 1 : 0) +
        (filters.minDays || filters.maxDays ? 1 : 0) +
        (filters.nearMe ? 1 : 0)
    );
}
