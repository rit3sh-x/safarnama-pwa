import { useState } from "react"
import { PencilIcon } from "lucide-react"
import { useAuthenticatedUser } from "@/modules/auth/hooks/use-authentication"
import { stringToHex, getInitials } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { EditProfileCredenza } from "./edit-profile-credenza"

export function ProfileSection() {
  const { user } = useAuthenticatedUser()
  const [editOpen, setEditOpen] = useState(false)

  const avatarBgColor = stringToHex(user.username)

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div className="relative">
        <Avatar
          className="size-12 sm:size-16 md:size-20 lg:size-24"
          style={{ backgroundColor: avatarBgColor }}
        >
          {user.image ? (
            <AvatarImage src={user.image} alt={user.username} />
          ) : (
            <AvatarFallback className="text-sm sm:text-base md:text-lg text-white">
              {getInitials(user.username)}
            </AvatarFallback>
          )}
        </Avatar>
      </div>

      <div className="text-center">
        <p className="text-lg font-semibold text-foreground">
          @{user.username}
        </p>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => setEditOpen(true)}
      >
        <PencilIcon className="size-3.5" />
        Edit Profile
      </Button>

      {editOpen && (
        <EditProfileCredenza
          open={editOpen}
          onOpenChange={setEditOpen}
          user={user}
        />
      )}
    </div>
  )
}