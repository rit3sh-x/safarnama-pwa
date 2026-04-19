import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

const STORAGE_PREFIX = "tour_done:";

const ICON_BASE =
    'xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"';

const ARROW_LEFT = `<svg ${ICON_BASE}><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>`;
const ARROW_RIGHT = `<svg ${ICON_BASE}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`;
const CHECK = `<svg ${ICON_BASE}><path d="M20 6 9 17l-5-5"/></svg>`;

const NEXT_BTN = `<span class="driver-btn-inner">Next ${ARROW_RIGHT}</span>`;
const PREV_BTN = `<span class="driver-btn-inner">${ARROW_LEFT} Previous</span>`;
const DONE_BTN = `<span class="driver-btn-inner">Done ${CHECK}</span>`;

export function hasSeenTour(id: string) {
    return localStorage.getItem(STORAGE_PREFIX + id) === "true";
}

export function markTourSeen(id: string) {
    localStorage.setItem(STORAGE_PREFIX + id, "true");
}

export function resetTour(id: string) {
    localStorage.removeItem(STORAGE_PREFIX + id);
}

export function runTour(id: string, steps: DriveStep[]) {
    if (hasSeenTour(id)) return;

    const visible = steps.filter((s) => {
        if (!s.element || typeof s.element !== "string") return true;
        return !!document.querySelector(s.element);
    });
    if (visible.length === 0) return;

    const d = driver({
        showProgress: true,
        allowClose: true,
        overlayOpacity: 0.6,
        nextBtnText: NEXT_BTN,
        prevBtnText: PREV_BTN,
        doneBtnText: DONE_BTN,
        steps: visible,
        onDestroyed: () => markTourSeen(id),
    });
    d.drive();
}
