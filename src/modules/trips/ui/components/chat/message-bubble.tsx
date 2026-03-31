import { useState } from "react";
import { cn, stringToHex } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import EmojiPickerReact, { EmojiStyle, Theme } from "emoji-picker-react";
import {
    ReplyIcon,
    CopyIcon,
    PencilIcon,
    Trash2Icon,
    PinIcon,
    PinOffIcon,
    ChevronDownIcon,
    SmileIcon,
    CheckCheckIcon,
    Clock3Icon,
    LogOutIcon,
    MailPlusIcon,
    ReceiptIcon,
    UserPlus2Icon,
} from "lucide-react";
import { HighlightSearchText } from "./message-search";
import { PollBubble } from "./poll-bubble";
import type { ChatMessage, Reaction } from "./types";
import { formatMessageTime } from "./utils";
import { QuickReactionPicker } from "./emoji-picker";
import { useTheme } from "@/hooks/use-theme";
import { useAuthenticatedUser } from "@/modules/auth/hooks/use-authentication";
import type { Id } from "@backend/dataModel";

interface MessageBubbleProps {
    message: ChatMessage;
    isOwn: boolean;
    isGrouped: boolean;
    showAvatar: boolean;
    currentUserId: string;
    isAdmin: boolean;
    replyMessage?: ChatMessage | null;
    searchQuery?: string;
    onReply: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onPin: () => void;
    onReaction: (emoji: string) => void;
    onImageClick: (url: string) => void;
    onVotePoll?: (pollId: Id<"poll">, optionIndex: number) => void;
    onClosePoll?: (pollId: Id<"poll">) => void;
}

export function MessageBubble({
    message,
    isOwn,
    isGrouped,
    showAvatar,
    currentUserId,
    isAdmin,
    replyMessage,
    searchQuery,
    onReply,
    onEdit,
    onDelete,
    onPin,
    onReaction,
    onImageClick,
    onVotePoll,
    onClosePoll,
}: MessageBubbleProps) {
    const { user } = useAuthenticatedUser();

    const { bg: avatarBgColor, text: avatarTextColor } = stringToHex(
        user.username
    );

    if (message.isSystem) {
        return <SystemMessage message={message} />;
    }

    return (
        <ContextMenu>
            <ContextMenuTrigger
                className={cn(
                    "select-text",
                    message.reactions.length > 0 && "relative z-10"
                )}
            >
                <div
                    id={`msg-${message._id}`}
                    className={cn(
                        "group/msg relative flex items-end gap-2 px-3 @lg:px-5",
                        isOwn ? "flex-row-reverse" : "flex-row",
                        isGrouped ? "mt-0.5" : "mt-3",
                        message.reactions.length > 0 && "mb-2"
                    )}
                >
                    {!isOwn && (
                        <div className="w-8 shrink-0">
                            {showAvatar && (
                                <Avatar size="sm">
                                    {message.senderImage ? (
                                        <AvatarImage
                                            src={message.senderImage}
                                        />
                                    ) : null}
                                    <AvatarFallback
                                        className="font-bold"
                                        style={{
                                            backgroundColor: avatarBgColor,
                                            color: avatarTextColor,
                                        }}
                                    >
                                        {message.senderName
                                            .split(" ")
                                            .slice(0, 2)
                                            .map(
                                                (w) => w[0]?.toUpperCase() ?? ""
                                            )
                                            .join("")}
                                    </AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    )}

                    <div
                        className={cn(
                            "relative max-w-[85%] @md:max-w-[75%] @2xl:max-w-[65%]"
                        )}
                    >
                        <HoverActionBar
                            message={message}
                            isOwn={isOwn}
                            isAdmin={isAdmin}
                            currentUserId={currentUserId}
                            onReply={onReply}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onPin={onPin}
                            onReaction={onReaction}
                        />

                        <div
                            className={cn(
                                "relative z-0 overflow-hidden rounded-2xl px-2.5 py-1.5",
                                isOwn
                                    ? cn(
                                          "bg-primary text-primary-foreground",
                                          showAvatar ? "rounded-br-sm" : "",
                                          message.isPending && "opacity-70"
                                      )
                                    : cn(
                                          "bg-secondary text-secondary-foreground",
                                          showAvatar ? "rounded-bl-sm" : ""
                                      )
                            )}
                        >
                            {!isOwn && showAvatar && (
                                <p className="mb-0.5 text-xs font-semibold text-ring">
                                    {message.senderName}
                                </p>
                            )}

                            {replyMessage && (
                                <ReplyPreview
                                    reply={replyMessage}
                                    isOwn={isOwn}
                                />
                            )}

                            {message.isPinned && (
                                <div
                                    className={cn(
                                        "mb-0.5 flex items-center gap-1 text-[10px]",
                                        isOwn
                                            ? "text-primary-foreground/60"
                                            : "text-muted-foreground"
                                    )}
                                >
                                    <PinIcon className="size-2.5" />
                                    <span>Pinned</span>
                                </div>
                            )}

                            {message.imageUrl && (
                                <button
                                    onClick={() =>
                                        onImageClick(message.imageUrl!)
                                    }
                                    className="my-1 block overflow-hidden rounded-xl"
                                >
                                    <img
                                        src={message.imageUrl}
                                        alt="Shared image"
                                        className="max-h-64 max-w-full rounded-xl object-cover"
                                        loading="lazy"
                                    />
                                </button>
                            )}

                            {message.isPoll && message.poll ? (
                                <PollBubble
                                    poll={message.poll}
                                    isOwn={isOwn}
                                    isCreator={
                                        message.senderId === currentUserId
                                    }
                                    isAdmin={isAdmin}
                                    onVote={(optionIndex) =>
                                        onVotePoll?.(
                                            message.poll!._id,
                                            optionIndex
                                        )
                                    }
                                    onClose={() =>
                                        onClosePoll?.(message.poll!._id)
                                    }
                                />
                            ) : (
                                <>
                                    {(!message.imageUrl ||
                                        message.content !== "📷 Photo") && (
                                        <p className="text-[15px] leading-relaxed wrap-break-word whitespace-pre-wrap">
                                            {message.isDeleted ? (
                                                <span className="italic opacity-60">
                                                    [deleted]
                                                </span>
                                            ) : searchQuery ? (
                                                <HighlightSearchText
                                                    query={searchQuery}
                                                    text={message.content}
                                                />
                                            ) : (
                                                message.content
                                            )}
                                        </p>
                                    )}
                                </>
                            )}

                            <div
                                className={cn(
                                    "mt-0.5 flex items-center justify-end gap-1",
                                    isOwn
                                        ? "text-primary-foreground/60"
                                        : "text-muted-foreground"
                                )}
                            >
                                {message.isEdited && (
                                    <span className="text-[10px] italic">
                                        edited
                                    </span>
                                )}
                                <span className="text-[11px]">
                                    {formatMessageTime(message.createdAt)}
                                </span>
                                {isOwn && (
                                    <StatusTicks
                                        isPending={message.isPending}
                                    />
                                )}
                            </div>
                        </div>

                        {message.reactions.length > 0 && (
                            <ReactionRow
                                reactions={message.reactions}
                                currentUserId={currentUserId}
                                onReaction={onReaction}
                                isOwn={isOwn}
                            />
                        )}
                    </div>
                </div>
            </ContextMenuTrigger>

            <MessageContextMenuContent
                message={message}
                isOwn={isOwn}
                isAdmin={isAdmin}
                currentUserId={currentUserId}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                onPin={onPin}
                onReaction={onReaction}
            />
        </ContextMenu>
    );
}

function SystemMessage({ message }: { message: ChatMessage }) {
    const iconMap: Record<
        string,
        { icon: typeof UserPlus2Icon; color: string }
    > = {
        member_joined: { icon: UserPlus2Icon, color: "text-emerald-500" },
        member_left: { icon: LogOutIcon, color: "text-muted-foreground" },
        member_invited: { icon: MailPlusIcon, color: "text-blue-500" },
        expense_event: { icon: ReceiptIcon, color: "text-amber-500" },
    };

    const config = iconMap[message.original.type ?? ""] ?? null;
    const Icon = config?.icon;

    return (
        <div className="my-2 flex justify-center px-4">
            <div className="flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1">
                {Icon && <Icon className={cn("size-3", config.color)} />}
                <span className="text-xs text-muted-foreground">
                    {message.content}
                </span>
            </div>
        </div>
    );
}

function ReplyPreview({
    reply,
    isOwn,
}: {
    reply: ChatMessage;
    isOwn: boolean;
}) {
    return (
        <div
            className={cn(
                "mb-1 rounded-lg border-l-[3px] border-ring px-2 py-1",
                isOwn ? "bg-white/15" : "bg-black/5 dark:bg-white/5"
            )}
        >
            <p
                className={cn(
                    "text-[11px] font-semibold",
                    isOwn ? "text-primary-foreground" : "text-primary"
                )}
            >
                {reply.senderName}
            </p>
            <p
                className={cn(
                    "truncate text-xs",
                    isOwn ? "text-white/70" : "text-muted-foreground"
                )}
            >
                {reply.isDeleted ? "[deleted]" : reply.content}
            </p>
        </div>
    );
}

function StatusTicks({ isPending }: { isPending: boolean }) {
    if (isPending) {
        return <Clock3Icon className="size-3 opacity-70" />;
    }
    return <CheckCheckIcon className="size-3.5 opacity-70" />;
}

function ReactionRow({
    reactions,
    currentUserId,
    onReaction,
    isOwn,
}: {
    reactions: Reaction[];
    currentUserId: string;
    onReaction: (emoji: string) => void;
    isOwn: boolean;
}) {
    return (
        <div
            className={cn(
                "relative z-20 -mt-0.5 flex flex-wrap gap-1 px-1 pb-1",
                isOwn ? "justify-end" : "justify-start"
            )}
        >
            {reactions.map((r) => {
                const hasReacted = r.userIds.includes(currentUserId);
                return (
                    <Button
                        key={r.emoji}
                        type="button"
                        variant="ghost"
                        onClick={() => onReaction(r.emoji)}
                        className={cn(
                            "h-auto items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-xs transition-colors",
                            hasReacted
                                ? "border-primary/30 bg-primary/10"
                                : "border-border bg-card hover:bg-muted"
                        )}
                    >
                        <span>{r.emoji}</span>
                        {r.count > 1 && (
                            <span className="text-[10px] text-muted-foreground">
                                {r.count}
                            </span>
                        )}
                    </Button>
                );
            })}
        </div>
    );
}

function HoverActionBar({
    message,
    isOwn,
    isAdmin,
    currentUserId,
    onReply,
    onEdit,
    onDelete,
    onPin,
    onReaction,
}: {
    message: ChatMessage;
    isOwn: boolean;
    isAdmin: boolean;
    currentUserId: string;
    onReply: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onPin: () => void;
    onReaction: (emoji: string) => void;
}) {
    const [reactionPopoverOpen, setReactionPopoverOpen] = useState(false);
    const [showFullReactionPicker, setShowFullReactionPicker] = useState(false);
    const { theme } = useTheme();
    const isDark = theme === "dark";

    if (message.isDeleted || message.isSystem) return null;

    return (
        <div
            className={cn(
                "pointer-events-none absolute -top-4 z-10 flex opacity-0 transition-opacity group-hover/msg:pointer-events-auto group-hover/msg:opacity-100",
                isOwn ? "left-0" : "right-0"
            )}
        >
            <div className="flex items-center gap-0.5 rounded-lg bg-card shadow-md ring-1 ring-border/50">
                <Popover
                    open={reactionPopoverOpen}
                    onOpenChange={(open) => {
                        setReactionPopoverOpen(open);
                        if (!open) setShowFullReactionPicker(false);
                    }}
                >
                    <PopoverTrigger
                        render={
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
                            />
                        }
                    >
                        <SmileIcon className="size-3.5" />
                    </PopoverTrigger>
                    <PopoverContent
                        side="top"
                        align="center"
                        className="w-auto p-2"
                    >
                        {showFullReactionPicker ? (
                            <EmojiPickerReact
                                onEmojiClick={(emojiData) => {
                                    onReaction(emojiData.emoji);
                                    setReactionPopoverOpen(false);
                                    setShowFullReactionPicker(false);
                                }}
                                theme={isDark ? Theme.DARK : Theme.LIGHT}
                                emojiStyle={EmojiStyle.NATIVE}
                                lazyLoadEmojis
                                searchPlaceHolder="Search emoji..."
                                width={320}
                                height={360}
                            />
                        ) : (
                            <QuickReactionPicker
                                onSelect={(emoji) => {
                                    onReaction(emoji);
                                    setReactionPopoverOpen(false);
                                }}
                                onOpenFull={() =>
                                    setShowFullReactionPicker(true)
                                }
                                currentUserId={currentUserId}
                                existingReactions={message.reactions}
                            />
                        )}
                    </PopoverContent>
                </Popover>

                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onReply}
                    className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
                >
                    <ReplyIcon className="size-3.5" />
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
                            />
                        }
                    >
                        <ChevronDownIcon className="size-3.5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" sideOffset={4}>
                        <DropdownMenuItem onClick={onReply}>
                            <ReplyIcon className="size-4" />
                            Reply
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => {
                                navigator.clipboard.writeText(message.content);
                            }}
                        >
                            <CopyIcon className="size-4" />
                            Copy
                        </DropdownMenuItem>
                        {isOwn && (
                            <DropdownMenuItem onClick={onEdit}>
                                <PencilIcon className="size-4" />
                                Edit
                            </DropdownMenuItem>
                        )}
                        {isAdmin && (
                            <DropdownMenuItem onClick={onPin}>
                                {message.isPinned ? (
                                    <PinOffIcon className="size-4" />
                                ) : (
                                    <PinIcon className="size-4" />
                                )}
                                {message.isPinned ? "Unpin" : "Pin"}
                            </DropdownMenuItem>
                        )}
                        {(isOwn || isAdmin) && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    variant="destructive"
                                    onClick={onDelete}
                                >
                                    <Trash2Icon className="size-4" />
                                    Delete
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}

function MessageContextMenuContent({
    message,
    isOwn,
    isAdmin,
    currentUserId,
    onReply,
    onEdit,
    onDelete,
    onPin,
    onReaction,
}: {
    message: ChatMessage;
    isOwn: boolean;
    isAdmin: boolean;
    currentUserId: string;
    onReply: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onPin: () => void;
    onReaction: (emoji: string) => void;
}) {
    const [showFullReactionPicker, setShowFullReactionPicker] = useState(false);
    const isDark = document.documentElement.classList.contains("dark");

    if (message.isDeleted || message.isSystem) {
        return <ContextMenuContent className="hidden" />;
    }

    return (
        <ContextMenuContent>
            <div className="px-2 py-2">
                {showFullReactionPicker ? (
                    <EmojiPickerReact
                        onEmojiClick={(emojiData) => {
                            onReaction(emojiData.emoji);
                            setShowFullReactionPicker(false);
                        }}
                        theme={isDark ? Theme.DARK : Theme.LIGHT}
                        emojiStyle={EmojiStyle.NATIVE}
                        lazyLoadEmojis
                        searchPlaceHolder="Search emoji..."
                        width={300}
                        height={320}
                    />
                ) : (
                    <QuickReactionPicker
                        onSelect={onReaction}
                        onOpenFull={() => setShowFullReactionPicker(true)}
                        currentUserId={currentUserId}
                        existingReactions={message.reactions}
                    />
                )}
            </div>

            <ContextMenuSeparator />

            <ContextMenuItem onClick={onReply}>
                <ReplyIcon className="size-4" />
                Reply
            </ContextMenuItem>
            <ContextMenuItem
                onClick={() => {
                    navigator.clipboard.writeText(message.content);
                }}
            >
                <CopyIcon className="size-4" />
                Copy
            </ContextMenuItem>
            {isOwn && (
                <ContextMenuItem onClick={onEdit}>
                    <PencilIcon className="size-4" />
                    Edit
                </ContextMenuItem>
            )}
            {isAdmin && (
                <ContextMenuItem onClick={onPin}>
                    {message.isPinned ? (
                        <PinOffIcon className="size-4" />
                    ) : (
                        <PinIcon className="size-4" />
                    )}
                    {message.isPinned ? "Unpin" : "Pin"}
                </ContextMenuItem>
            )}
            {(isOwn || isAdmin) && (
                <>
                    <ContextMenuSeparator />
                    <ContextMenuItem variant="destructive" onClick={onDelete}>
                        <Trash2Icon className="size-4" />
                        Delete
                    </ContextMenuItem>
                </>
            )}
        </ContextMenuContent>
    );
}
