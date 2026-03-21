import {
  ArrowLeftIcon,
  SearchIcon,
  UserPlusIcon,
  MoreVerticalIcon,
  InfoIcon,
  WalletIcon,
  MapIcon,
} from "lucide-react"
import { getInitials, stringToHex } from "@/lib/utils"
import type { Id } from "@backend/dataModel"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSetAtom } from "jotai"
import { tripPanelViewAtom } from "../../atoms"

interface ChatHeaderProps {
  name: string
  tripId: Id<"trip">
  logo?: string
  showBack?: boolean
  onBack: () => void
  onGroupPress: () => void
  onSearchPress?: () => void
  onInvitePress?: () => void
}

export function ChatHeader({
  onBack,
  onGroupPress,
  onSearchPress,
  onInvitePress,
  name,
  tripId,
  logo,
  showBack = true,
}: ChatHeaderProps) {
  const initials = getInitials(name)
  const bgColor = stringToHex(tripId)
  const setPanelView = useSetAtom(tripPanelViewAtom)

  return (
    <div className="border-b bg-card">
      <div className="flex h-14 items-center px-1">
        {showBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-10 w-10"
          >
            <ArrowLeftIcon className="h-6 w-6 text-foreground" />
          </Button>
        )}
        {!showBack && <div className="w-2" />}

        <button
          onClick={onGroupPress}
          className="flex flex-1 cursor-pointer items-center gap-3 overflow-hidden rounded-full p-1 pr-2 text-left hover:bg-muted"
        >
          <div className="h-10 w-10 overflow-hidden rounded-full">
            {logo ? (
              <img
                src={logo}
                alt={name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center text-sm font-bold text-white"
                style={{ backgroundColor: bgColor }}
              >
                {initials}
              </div>
            )}
          </div>

          <div className="flex-1">
            <p className="truncate text-base font-semibold text-foreground">
              {name}
            </p>
          </div>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" className="h-10 w-10" />
            }
          >
            <MoreVerticalIcon className="h-5 w-5 text-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={4} className={"w-64"}>
            <DropdownMenuItem onClick={() => setPanelView("info")}>
              <InfoIcon className="size-4" />
              Trip Info
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPanelView("expenses")}>
              <WalletIcon className="size-4" />
              Expenses
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPanelView("plan")}>
              <MapIcon className="size-4" />
              Plan Trip
            </DropdownMenuItem>
            {onSearchPress && (
              <DropdownMenuItem onClick={onSearchPress}>
                <SearchIcon className="size-4" />
                Search Messages
                <span className="ml-auto text-[10px] text-muted-foreground">
                  Ctrl+Shift+F
                </span>
              </DropdownMenuItem>
            )}
            {onInvitePress && (
              <DropdownMenuItem onClick={onInvitePress}>
                <UserPlusIcon className="size-4" />
                Invite Members
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
