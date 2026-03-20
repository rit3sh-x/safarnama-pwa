import { useCallback, useEffect, useMemo, useState } from "react"
import {
  useMessages,
  useSendMessage,
  useEditMessage,
  useDeleteMessage,
  useAddReaction,
  useRemoveReaction,
  usePinMessage,
  useUnpinMessage,
  useMarkRead,
} from "../../hooks/use-messages"
import { useAuthenticatedUser } from "@/modules/auth/hooks/use-authentication"
import { useUploadFileToConvex } from "@/lib/utils"
import type { TripId } from "../../types"
import {
  ChatMessageList,
  ChatInputToolbar,
  ImageLightbox,
  MessageSearch,
  DeleteMessageDialog,
  toChatMessage,
} from "../components/chat"
import type { ChatMessage } from "../components/chat"
import { ChatHeader } from "../components/chat-header"
import { InviteMembersModal } from "../components/invite-members-modal"
import { useRouter } from "@tanstack/react-router"
import { useAtomValue } from "jotai"
import { selectedTripAtom } from "../../atoms"
import type { Id } from "@backend/dataModel"

interface TripChatViewProps {
  tripId: TripId
  isPanel?: boolean
}

export function TripChatView({ tripId, isPanel = false }: TripChatViewProps) {
  const router = useRouter()
  const { user } = useAuthenticatedUser()
  const selectedTrip = useAtomValue(selectedTripAtom)
  const { messages, isLoading, canLoadMore, loadMore } = useMessages(tripId)
  const { mutate: sendMessage } = useSendMessage()
  const { mutate: editMessage } = useEditMessage()
  const { mutate: deleteMessage } = useDeleteMessage()
  const { mutate: addReaction } = useAddReaction()
  const { mutate: removeReaction } = useRemoveReaction()
  const { mutate: pinMessage } = usePinMessage()
  const { mutate: unpinMessage } = useUnpinMessage()
  const markRead = useMarkRead(tripId)
  const uploadFile = useUploadFileToConvex()

  const currentUserId = user._id
  const isAdmin = selectedTrip?.role === "owner"

  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null)
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ChatMessage | null>(null)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [showInvite, setShowInvite] = useState(false)

  useEffect(() => {
    if (messages.length > 0) markRead()
  }, [messages.length, markRead])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "F") {
        e.preventDefault()
        setShowSearch((v) => !v)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const chatMessages: ChatMessage[] = useMemo(
    () => [...messages].reverse().map((m) => toChatMessage(m)),
    [messages]
  )

  const messageMap = useMemo(() => {
    const map = new Map<string, ChatMessage>()
    for (const m of chatMessages) map.set(m._id, m)
    return map
  }, [chatMessages])

  const handleSend = useCallback(
    (text: string) => {
      if (editingMessage) {
        editMessage({
          messageId: editingMessage._id,
          content: text,
        })
        setEditingMessage(null)
        return
      }

      sendMessage({
        tripId,
        content: text,
        ...(replyTo ? { replyToId: replyTo._id } : {}),
      })
      setReplyTo(null)
    },
    [tripId, sendMessage, editMessage, replyTo, editingMessage]
  )

  const handleSendImage = useCallback(
    (url: string) => {
      sendMessage({
        tripId,
        content: "📷 Photo",
        attachmentUrl: url,
        attachmentType: "image",
      })
    },
    [tripId, sendMessage]
  )

  const handleUploadFile = useCallback(
    async (file: File) => {
      setIsUploading(true)
      try {
        return await uploadFile(file)
      } catch (e) {
        console.error("Failed to upload file", e)
        return null
      } finally {
        setIsUploading(false)
      }
    },
    [uploadFile]
  )

  const handleReaction = useCallback(
    (messageId: Id<"message">, emoji: string) => {
      const msg = messageMap.get(messageId)
      if (!msg) return
      const existing = msg.reactions.find(
        (r) => r.emoji === emoji && r.userIds.includes(currentUserId)
      )
      if (existing) {
        removeReaction({ messageId, emoji })
      } else {
        addReaction({ messageId, emoji })
      }
    },
    [messageMap, addReaction, removeReaction, currentUserId]
  )

  const handlePin = useCallback(
    (messageId: Id<"message">) => {
      const msg = messageMap.get(messageId)
      if (!msg) return
      if (msg.isPinned) {
        unpinMessage({ messageId })
      } else {
        pinMessage({ messageId })
      }
    },
    [messageMap, pinMessage, unpinMessage]
  )

  const handleNavigateToMessage = useCallback((messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" })
      el.classList.add("bg-primary/5")
      setTimeout(() => el.classList.remove("bg-primary/5"), 2000)
    }
  }, [])

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {isPanel && (
        <ChatHeader
          name={selectedTrip?.name ?? "Chat"}
          tripId={tripId}
          logo={selectedTrip?.logo ?? undefined}
          showBack={false}
          onBack={() => router.history.back()}
          onGroupPress={() =>
            router.navigate({
              to: "/trips/$tripId/info",
              params: { tripId },
            })
          }
          onSearchPress={() => setShowSearch((v) => !v)}
          onInvitePress={() => setShowInvite(true)}
        />
      )}

      {showSearch && (
        <MessageSearch
          messages={chatMessages}
          onClose={() => {
            setShowSearch(false)
            setSearchQuery("")
          }}
          onNavigateToMessage={handleNavigateToMessage}
        />
      )}

      <ChatMessageList
        messages={chatMessages}
        isLoading={isLoading}
        canLoadMore={canLoadMore}
        onLoadMore={loadMore}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        searchQuery={showSearch ? searchQuery : undefined}
        onReply={setReplyTo}
        onEdit={setEditingMessage}
        onDelete={setDeleteTarget}
        onPin={handlePin}
        onReaction={handleReaction}
        onImageClick={setLightboxSrc}
      />

      <ChatInputToolbar
        onSend={handleSend}
        onSendImage={handleSendImage}
        replyTo={replyTo}
        editingMessage={editingMessage}
        isUploading={isUploading}
        onClearReply={() => setReplyTo(null)}
        onClearEdit={() => setEditingMessage(null)}
        onUploadFile={handleUploadFile}
      />

      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />

      <DeleteMessageDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMessage({ messageId: deleteTarget._id })
            setDeleteTarget(null)
          }
        }}
      />

      {selectedTrip?.orgId && (
        <InviteMembersModal
          open={showInvite}
          onOpenChange={setShowInvite}
          orgId={selectedTrip.orgId}
        />
      )}
    </div>
  )
}
