import {
  ArrowLeftIcon,
  BookTextIcon,
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
import { useAtomValue, useSetAtom } from "jotai"
import { selectedTripAtom, tripPanelViewAtom } from "../../atoms"
import { useBlogByTrip, useSaveBlog } from "@/modules/blog/hooks/use-blogs"
import { useNavigate } from "@tanstack/react-router"

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
  const navigate = useNavigate()
  const initials = getInitials(name)
  const bgColor = stringToHex(tripId)
  const setPanelView = useSetAtom(tripPanelViewAtom)
  const selectedTrip = useAtomValue(selectedTripAtom)
  const isOwner = selectedTrip?.role === "owner"
  const { blog } = useBlogByTrip(tripId)
  const { mutate: saveBlog } = useSaveBlog()

  const handleWriteBlog = async () => {
    if (blog) {
      navigate({ to: "/blogs/$blogId/edit", params: { blogId: blog._id } })
    } else {
      const blogId = await saveBlog({
        tripId,
        title: "Untitled",
        content: "",
        status: "draft",
      })
      if (blogId) {
        navigate({ to: "/blogs/$blogId/edit", params: { blogId } })
      }
    }
  }

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
            {isOwner && (
              <DropdownMenuItem onClick={handleWriteBlog}>
                <BookTextIcon className="size-4" />
                Write Blog
              </DropdownMenuItem>
            )}
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
