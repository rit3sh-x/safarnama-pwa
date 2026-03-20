import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"
import { Crown } from "lucide-react"

interface MemberListItemProps {
  name: string
  username: string
  image: string | null
  isOwner?: boolean
}

export function MemberListItem({
  name,
  username,
  image,
  isOwner,
}: MemberListItemProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <Avatar size="lg">
        {image && <AvatarImage src={image} alt={name} />}
        <AvatarFallback>{getInitials(name)}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        <p className="truncate text-xs text-muted-foreground">@{username}</p>
      </div>

      {isOwner && (
        <div className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
          <Crown className="size-3" />
          Admin
        </div>
      )}
    </div>
  )
}
