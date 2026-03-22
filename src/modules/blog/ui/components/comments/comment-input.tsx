import { useState, useRef, useEffect } from "react"
import { SendHorizontalIcon } from "lucide-react"
import { useAuthenticatedUser } from "@/modules/auth/hooks/use-authentication"
import { stringToHex } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

interface CommentInputProps {
  onSubmit: (content: string) => void | Promise<void>
  onCancel?: () => void
  placeholder?: string
  autoFocus?: boolean
  initialValue?: string
  isPending?: boolean
}

export function CommentInput({
  onSubmit,
  onCancel,
  placeholder = "Add a comment...",
  autoFocus = false,
  initialValue = "",
  isPending = false,
}: CommentInputProps) {
  const { user } = useAuthenticatedUser()
  const [value, setValue] = useState(initialValue)
  const [focused, setFocused] = useState(autoFocus)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus()
  }, [autoFocus])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  const handleSubmit = async () => {
    const trimmed = value.trim()
    if (!trimmed) return
    await onSubmit(trimmed)
    setValue("")
    setFocused(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === "Escape" && onCancel) {
      onCancel()
    }
  }

  const avatarBg = stringToHex(user.username)

  return (
    <div className="flex gap-3">
      <Avatar className="size-8 shrink-0" style={{ backgroundColor: avatarBg }}>
        {user.image ? (
          <AvatarImage src={user.image} alt={user.username} />
        ) : (
          <AvatarFallback className="text-xs text-white">
            {user.username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        )}
      </Avatar>

      <div className="flex-1">
        <textarea
          ref={textareaRef}
          aria-label={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="w-full resize-none border-b border-border bg-transparent pb-1.5 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-foreground"
        />

        {(focused || value) && (
          <div className="mt-2 flex justify-end gap-2">
            {onCancel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setValue(initialValue)
                  setFocused(false)
                  onCancel()
                }}
              >
                Cancel
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!value.trim() || isPending}
              className="gap-1.5"
            >
              <SendHorizontalIcon className="size-3.5" />
              {initialValue ? "Save" : "Comment"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
