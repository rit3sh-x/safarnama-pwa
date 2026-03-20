import { useCallback, useEffect, useMemo, useRef } from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { InfiniteScrollTrigger } from "@/components/infinite-scroll-trigger"
import { MessageBubble } from "./message-bubble"
import { ScrollToBottomButton } from "./scroll-to-bottom-button"
import type { ChatMessage } from "./types"
import { isSameGroup, formatDateSeparator } from "./utils"
import type { Id } from "@backend/dataModel"

interface ChatMessageListProps {
  messages: ChatMessage[]
  isLoading: boolean
  canLoadMore: boolean
  onLoadMore: () => void
  currentUserId: string
  isAdmin: boolean
  searchQuery?: string
  onReply: (msg: ChatMessage) => void
  onEdit: (msg: ChatMessage) => void
  onDelete: (msg: ChatMessage) => void
  onPin: (messageId: Id<"message">) => void
  onReaction: (messageId: Id<"message">, emoji: string) => void
  onImageClick: (url: string) => void
}

export function ChatMessageList({
  messages,
  isLoading,
  canLoadMore,
  onLoadMore,
  currentUserId,
  isAdmin,
  searchQuery,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onReaction,
  onImageClick,
}: ChatMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const prevMessageCountRef = useRef(0)
  const isNearBottomRef = useRef(true)

  const messageMap = useMemo(() => {
    const map = new Map<string, ChatMessage>()
    for (const m of messages) map.set(m._id, m)
    return map
  }, [messages])

  const groupedMessages = useMemo(() => {
    const groups: Array<{ date: string; messages: ChatMessage[] }> = []
    let currentDate = ""

    for (const msg of messages) {
      const dateStr = formatDateSeparator(msg.createdAt)
      if (dateStr !== currentDate) {
        currentDate = dateStr
        groups.push({ date: dateStr, messages: [msg] })
      } else {
        groups[groups.length - 1].messages.push(msg)
      }
    }

    return groups
  }, [messages])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const threshold = 100
    isNearBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold
  }, [])

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "instant",
    })
  }, [])

  useEffect(() => {
    const prevCount = prevMessageCountRef.current
    const newCount = messages.length
    prevMessageCountRef.current = newCount

    if (prevCount === 0 && newCount > 0) {
      requestAnimationFrame(() => scrollToBottom(false))
    } else if (newCount > prevCount && isNearBottomRef.current) {
      requestAnimationFrame(() => scrollToBottom(true))
    }
  }, [messages.length, scrollToBottom])

  return (
    <>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        {canLoadMore && (
          <InfiniteScrollTrigger
            canLoadMore={canLoadMore}
            isLoadingMore={isLoading}
            onLoadMore={onLoadMore}
            loadMoreText="Load earlier messages"
          />
        )}

        {isLoading && messages.length === 0 && <MessageListSkeleton />}

        {!isLoading && messages.length === 0 && <EmptyChat />}

        <div className="pb-4">
          {groupedMessages.map((group) => (
            <div key={group.date}>
              <div className="my-4 flex justify-center">
                <span className="rounded-lg bg-muted/80 px-3 py-1 text-xs font-semibold text-muted-foreground shadow-sm">
                  {group.date}
                </span>
              </div>

              {group.messages.map((msg, i) => {
                const prev = group.messages[i - 1]
                const isGrouped = !!prev && isSameGroup(prev, msg)
                const isOwn = msg.senderId === currentUserId
                const showAvatar = !isGrouped
                const replyMsg = msg.replyToId
                  ? (messageMap.get(msg.replyToId) ?? null)
                  : null

                return (
                  <MessageBubble
                    key={msg._id}
                    message={msg}
                    isOwn={isOwn}
                    isGrouped={isGrouped}
                    showAvatar={showAvatar}
                    currentUserId={currentUserId}
                    isAdmin={isAdmin}
                    replyMessage={replyMsg}
                    searchQuery={searchQuery}
                    onReply={() => onReply(msg)}
                    onEdit={() => onEdit(msg)}
                    onDelete={() => onDelete(msg)}
                    onPin={() => onPin(msg._id)}
                    onReaction={(emoji) => onReaction(msg._id, emoji)}
                    onImageClick={onImageClick}
                  />
                )
              })}
            </div>
          ))}
        </div>

        <div ref={bottomRef} />
      </div>

      <ScrollToBottomButton
        scrollRef={scrollRef}
        onClick={() => scrollToBottom(true)}
      />
    </>
  )
}

function MessageListSkeleton() {
  return (
    <div className="space-y-4 px-4 py-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex gap-2",
            i % 3 === 0 ? "flex-row-reverse" : "flex-row"
          )}
        >
          {i % 3 !== 0 && <Skeleton className="size-8 rounded-full" />}
          <Skeleton
            className={cn("h-10 rounded-2xl", i % 2 === 0 ? "w-48" : "w-64")}
          />
        </div>
      ))}
    </div>
  )
}

function EmptyChat() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-20">
      <p className="text-lg font-medium text-foreground">No messages yet</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Send the first message to start the conversation!
      </p>
    </div>
  )
}
