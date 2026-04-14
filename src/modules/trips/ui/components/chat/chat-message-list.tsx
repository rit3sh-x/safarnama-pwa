import { useCallback, useMemo, useRef, useState } from "react";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";
import { MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { MessageBubble } from "./message-bubble";
import { ScrollToBottomButton } from "./scroll-to-bottom-button";
import type { ChatMessage } from "./types";
import { isSameGroup, formatDateSeparator } from "./utils";
import type { Id } from "@backend/dataModel";

const START_INDEX = 100_000;

interface ChatMessageListProps {
    messages: ChatMessage[];
    messageMap: Map<string, ChatMessage>;
    isLoading: boolean;
    canLoadMore: boolean;
    onLoadMore: () => void;
    currentUserId: string;
    isAdmin: boolean;
    searchQuery?: string;
    onReply: (messageId: string) => void;
    onEdit: (messageId: string) => void;
    onDelete: (messageId: string) => void;
    onPin: (messageId: string) => void;
    onReaction: (messageId: string, emoji: string) => void;
    onImageClick: (url: string) => void;
    onVotePoll?: (pollId: Id<"poll">, optionIndex: number) => void;
    onClosePoll?: (pollId: Id<"poll">) => void;
}

export function ChatMessageList({
    messages,
    messageMap,
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
    onVotePoll,
    onClosePoll,
}: ChatMessageListProps) {
    const virtuosoRef = useRef<VirtuosoHandle>(null);
    const [atBottom, setAtBottom] = useState(true);

    const firstItemIndex = useMemo(
        () => START_INDEX - messages.length,
        [messages.length]
    );

    const scrollToBottom = useCallback(() => {
        virtuosoRef.current?.scrollToIndex({
            index: messages.length - 1,
            align: "end",
            behavior: "smooth",
        });
    }, [messages.length]);

    const handleStartReached = useCallback(() => {
        if (canLoadMore && !isLoading) {
            onLoadMore();
        }
    }, [canLoadMore, isLoading, onLoadMore]);

    const itemContent = useCallback(
        (virtuosoIndex: number) => {
            const dataIndex = virtuosoIndex - firstItemIndex;
            const msg = messages[dataIndex];
            if (!msg) return null;

            const prev = dataIndex > 0 ? messages[dataIndex - 1] : undefined;
            const isGrouped = !!prev && isSameGroup(prev, msg);
            const isOwn = msg.senderId === currentUserId;
            const showAvatar = !isGrouped;
            const replyMsg = msg.replyToId
                ? (messageMap.get(msg.replyToId) ?? null)
                : null;

            const prevDateStr = prev ? formatDateSeparator(prev.createdAt) : "";
            const curDateStr = formatDateSeparator(msg.createdAt);
            const showDateSeparator = !prev || prevDateStr !== curDateStr;

            return (
                <div>
                    {showDateSeparator && (
                        <div className="my-4 flex justify-center">
                            <span className="rounded-lg bg-muted/80 px-3 py-1 text-xs font-semibold text-muted-foreground shadow-sm">
                                {curDateStr}
                            </span>
                        </div>
                    )}
                    <MessageBubble
                        message={msg}
                        isOwn={isOwn}
                        isGrouped={isGrouped}
                        showAvatar={showAvatar}
                        currentUserId={currentUserId}
                        isAdmin={isAdmin}
                        replyMessage={replyMsg}
                        searchQuery={searchQuery}
                        onReply={onReply}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onPin={onPin}
                        onReaction={onReaction}
                        onImageClick={onImageClick}
                        onVotePoll={onVotePoll}
                        onClosePoll={onClosePoll}
                    />
                </div>
            );
        },
        [
            firstItemIndex,
            messages,
            messageMap,
            currentUserId,
            isAdmin,
            searchQuery,
            onReply,
            onEdit,
            onDelete,
            onPin,
            onReaction,
            onImageClick,
            onVotePoll,
            onClosePoll,
        ]
    );

    if (isLoading && messages.length === 0) {
        return <MessageListSkeleton />;
    }

    if (!isLoading && messages.length === 0) {
        return <EmptyChat />;
    }

    return (
        <div className="relative min-h-0 flex-1 overflow-hidden">
            <Virtuoso
                className="h-full w-full"
                ref={virtuosoRef}
                totalCount={messages.length}
                firstItemIndex={firstItemIndex}
                initialTopMostItemIndex={messages.length - 1}
                itemContent={itemContent}
                computeItemKey={(virtuosoIndex) => {
                    const dataIndex = virtuosoIndex - firstItemIndex;
                    return messages[dataIndex]?._id ?? String(virtuosoIndex);
                }}
                startReached={handleStartReached}
                followOutput="smooth"
                atBottomStateChange={setAtBottom}
                atBottomThreshold={4}
                style={{ height: "100%" }}
                increaseViewportBy={{ top: 200, bottom: 200 }}
                components={{
                    Header: canLoadMore
                        ? () => (
                              <div className="flex justify-center py-2">
                                  {isLoading && (
                                      <span className="text-xs text-muted-foreground">
                                          Loading earlier messages...
                                      </span>
                                  )}
                              </div>
                          )
                        : undefined,
                    Footer: () => <div className="h-3" />,
                }}
            />

            <ScrollToBottomButton
                visible={!atBottom}
                onClick={scrollToBottom}
            />
        </div>
    );
}

function MessageListSkeleton() {
    return (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-4 py-6">
            {Array.from({ length: 12 }).map((_, i) => (
                <div
                    key={i}
                    className={cn(
                        "flex gap-2",
                        i % 3 === 0 ? "flex-row-reverse" : "flex-row"
                    )}
                >
                    {i % 3 !== 0 && (
                        <Skeleton className="size-8 shrink-0 rounded-full" />
                    )}
                    <Skeleton
                        className={cn(
                            "h-10 rounded-2xl",
                            i % 2 === 0
                                ? "w-48 max-w-[60%]"
                                : "w-64 max-w-[75%]"
                        )}
                    />
                </div>
            ))}
        </div>
    );
}

function EmptyChat() {
    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 py-20 text-center">
            <div className="flex size-20 items-center justify-center rounded-full bg-muted">
                <MessageSquare className="size-10 text-muted-foreground" />
            </div>
            <div>
                <p className="text-xl font-semibold text-foreground">
                    No messages yet
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                    Send the first message to start the conversation!
                </p>
            </div>
        </div>
    );
}
