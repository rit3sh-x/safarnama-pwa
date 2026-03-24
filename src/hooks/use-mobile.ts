import { useEffect, useState } from "react";

export const MOBILE_BREAKPOINT = 768;
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

export function getIsMobile() {
    if (typeof window === "undefined") return false;
    return window.matchMedia(MOBILE_QUERY).matches;
}

export function useIsMobile() {
    const [isMobile, setIsMobile] = useState(getIsMobile);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const mql = window.matchMedia(MOBILE_QUERY);
        const onChange = (event: MediaQueryListEvent) => {
            setIsMobile(event.matches);
        };

        mql.addEventListener("change", onChange);
        return () => mql.removeEventListener("change", onChange);
    }, []);

    return isMobile;
}
