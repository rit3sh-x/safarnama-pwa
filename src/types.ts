import type { RegisteredRouter } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

export type AppRoutePath = keyof RegisteredRouter["routesByPath"];

export interface Tab {
    name: string;
    title: string;
    icon: LucideIcon;
    route: AppRoutePath;
}
