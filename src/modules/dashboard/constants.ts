import type { Tab } from "@/types"
import {
  BookTextIcon,
  HomeIcon,
  MapIcon,
  SettingsIcon,
  Wallet2Icon,
} from "lucide-react"

export const TABS: Tab[] = [
  {
    name: "dashboard",
    title: "Dashboard",
    icon: HomeIcon,
    route: "/dashboard",
  },
  {
    name: "trips",
    title: "Trips",
    icon: MapIcon,
    route: "/trips",
  },
  {
    name: "expenses",
    title: "Expenses",
    icon: Wallet2Icon,
    route: "/expenses",
  },
  {
    name: "blogs",
    title: "Blogs",
    icon: BookTextIcon,
    route: "/blogs",
  },
  {
    name: "settings",
    title: "Settings",
    icon: SettingsIcon,
    route: "/settings",
  },
]
