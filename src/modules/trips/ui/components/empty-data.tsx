import { MapIcon, MessageCircleIcon } from "lucide-react"
import { useNavigationOptions } from "../../hooks/use-navigation-options"
import type { NavOption } from "../../types"

export function EmptyData() {
  const { tab } = useNavigationOptions()

  let title = ""
  let description = ""
  let Icon = MapIcon

  switch (tab as NavOption) {
    case "invites":
      title = "No invites yet"
      description = "When someone invites you to a trip, it will appear here"
      Icon = MessageCircleIcon
      break
    case "public_trips":
      title = "No public trips"
      description = "Check back later to discover community-shared adventures"
      Icon = MapIcon
      break
    case "trips":
    default:
      title = "No trips yet"
      description = "Create a new trip to start planning with your group"
      Icon = MapIcon
      break
  }

  return (
    <div className="flex flex-1 items-center justify-center gap-2 px-8 text-center">
      <Icon className="mb-4 h-10 w-10 text-muted-foreground" />

      <p className="text-lg font-semibold text-foreground">{title}</p>

      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
