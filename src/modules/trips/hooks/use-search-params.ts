import { useAtom, useAtomValue } from "jotai";
import { useCallback } from "react";
import { searchMapAtom, navOptionsAtom } from "../atoms";

export const useSearchParams = () => {
    const [searchMap, setSearchMap] = useAtom(searchMapAtom);
    const tab = useAtomValue(navOptionsAtom);

    const search = searchMap[tab];

    const setSearch = useCallback(
        (value: string | undefined) => {
            setSearchMap((prev) => ({ ...prev, [tab]: value }));
        },
        [setSearchMap, tab]
    );

    const resetSearch = useCallback(() => {
        setSearchMap((prev) => ({ ...prev, [tab]: undefined }));
    }, [setSearchMap, tab]);

    return {
        search,
        setSearch,
        resetSearch,
    };
};
