import { useEffect } from "react";
import type { DriveStep } from "driver.js";
import { runTour } from "@/lib/tour";

export function useTour(id: string, steps: DriveStep[], enabled = true) {
    useEffect(() => {
        if (!enabled) return;
        const t = setTimeout(() => runTour(id, steps), 450);
        return () => clearTimeout(t);
    }, [enabled, id, steps]);
}
