import {
    InfoIcon,
    MapIcon,
    MessageSquareIcon,
    Wallet2Icon,
} from "lucide-react";
import type { Tab } from "@/types";

export const COVER_IMAGE_MAX_SIZE = 1 * 1024 * 1024;

export const SAME_GROUP_THRESHOLD_MS = 60_000;

export const TRIPS_STORAGE_KEYS = {
    searchMap: "trips_search_map",
    navOption: "trips_nav_option",
    selectedTrip: "trips_selected_trip",
    panelView: "trips_panel_view",
    publicPreview: "trips_public_preview",
} as const;

export const QUICK_REACTIONS = [
    { emoji: "👍", label: "like" },
    { emoji: "❤️", label: "love" },
    { emoji: "😂", label: "laugh" },
    { emoji: "🔥", label: "fire" },
    { emoji: "😢", label: "sad" },
    { emoji: "🙏", label: "thanks" },
];

export const TRIP_TABS = [
    {
        name: "chat",
        title: "Chat",
        icon: MessageSquareIcon,
        route: "/trips/$tripId/chat",
    },
    {
        name: "expenses",
        title: "Expenses",
        icon: Wallet2Icon,
        route: "/trips/$tripId/expenses",
    },
    {
        name: "plan",
        title: "Plan",
        icon: MapIcon,
        route: "/plan/$tripId",
    },
    {
        name: "info",
        title: "Info",
        icon: InfoIcon,
        route: "/trips/$tripId/info",
    },
] as const satisfies readonly Tab[];
