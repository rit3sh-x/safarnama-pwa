import {
  ArrowLeftIcon,
  SearchIcon,
  UserPlusIcon,
  MoreVerticalIcon,
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
          className="flex flex-1 items-center gap-3 pr-2 text-left"
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
          <DropdownMenuContent align="end" sideOffset={4}>
            {onSearchPress && (
              <DropdownMenuItem onClick={onSearchPress}>
                <SearchIcon className="size-4" />
                Search Messages
                <span className="ml-auto text-xs text-muted-foreground">
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
