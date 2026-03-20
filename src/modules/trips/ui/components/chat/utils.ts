import { SAME_GROUP_THRESHOLD_MS } from "@/modules/trips/constants"
import type { ChatMessage } from "./types"

export function isSameGroup(a: ChatMessage, b: ChatMessage): boolean {
  if (a.isSystem || b.isSystem) return false
  if (a.senderId !== b.senderId) return false
  const diff = Math.abs(a.createdAt.getTime() - b.createdAt.getTime())
  return diff < SAME_GROUP_THRESHOLD_MS
}

export function formatMessageTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

export function formatDateSeparator(date: Date): string {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.floor(
    (today.getTime() - msgDate.getTime()) / 86_400_000
  )

  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: "long" })
  }
  return date.toLocaleDateString([], {
    day: "numeric",
    month: "long",
    ...(date.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
  })
}
