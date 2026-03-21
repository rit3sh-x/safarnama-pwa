import { useState } from "react"
import EmojiPickerReact, { Theme, EmojiStyle } from "emoji-picker-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { PlusIcon, SmileIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { QUICK_REACTIONS } from "@/modules/trips/constants"

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  side?: "top" | "bottom" | "left" | "right"
  align?: "start" | "center" | "end"
  children?: React.ReactNode
}

export function EmojiPicker({
  onSelect,
  side = "top",
  align = "end",
  children,
}: EmojiPickerProps) {
  const [open, setOpen] = useState(false)

  const isDark = document.documentElement.classList.contains("dark")

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          children ? undefined : (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-full"
            >
              <SmileIcon className="size-5 text-muted-foreground" />
            </Button>
          )
        }
      >
        {children}
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        className="w-auto border-0 p-0 shadow-xl"
      >
        <EmojiPickerReact
          onEmojiClick={(emojiData) => {
            onSelect(emojiData.emoji)
            setOpen(false)
          }}
          theme={isDark ? Theme.DARK : Theme.LIGHT}
          emojiStyle={EmojiStyle.NATIVE}
          lazyLoadEmojis
          searchPlaceHolder="Search emoji..."
          width={320}
          height={400}
        />
      </PopoverContent>
    </Popover>
  )
}

import type { Reaction } from "./types"

interface QuickReactionPickerProps {
  onSelect: (emoji: string) => void
  onOpenFull: () => void
  currentUserId: string
  existingReactions?: Reaction[]
}

export function QuickReactionPicker({
  onSelect,
  onOpenFull,
  currentUserId,
  existingReactions = [],
}: QuickReactionPickerProps) {
  return (
    <div className="flex items-center gap-0.5">
      {QUICK_REACTIONS.map((e) => {
        const hasReacted = existingReactions.some(
          (r) => r.emoji === e.emoji && r.userIds.includes(currentUserId)
        )
        return (
          <Button
            key={e.label}
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onSelect(e.emoji)}
            className={cn(
              "h-8 w-8 rounded-full p-0 text-lg",
              hasReacted && "bg-primary/15 ring-1 ring-primary/30"
            )}
          >
            {e.emoji}
          </Button>
        )
      })}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onOpenFull}
        className="h-8 w-8 rounded-full text-muted-foreground"
        aria-label="Open full emoji picker"
      >
        <PlusIcon className="size-4" />
      </Button>
    </div>
  )
}
