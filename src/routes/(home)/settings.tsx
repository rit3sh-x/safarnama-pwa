import { SettingsView } from "@/modules/settings/ui/views/settings-view"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/(home)/settings")({
  component: SettingsView,
})
