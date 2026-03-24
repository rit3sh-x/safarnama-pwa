import type { Id } from "@backend/dataModel";
import type { Message } from "../../../types";

export interface Reaction {
    emoji: string;
    count: number;
    userIds: string[];
}

export interface ChatMessage {
    _id: Id<"message">;
    content: string;
    createdAt: Date;
    senderId: string;
    senderName: string;
    senderImage?: string;
    isSystem: boolean;
    isDeleted: boolean;
    isEdited: boolean;
    isPinned: boolean;
    isPending: boolean;
    imageUrl?: string;
    replyToId?: Id<"message">;
    reactions: Reaction[];
    original: Message;
}

type MessageWithOptimistic = Message & { _optimistic?: boolean };

export function toChatMessage(msg: Message): ChatMessage {
    const isSystem =
        msg.type === "member_joined" ||
        msg.type === "member_left" ||
        msg.type === "member_invited";
    const isOptimistic = !!(msg as MessageWithOptimistic)._optimistic;

    return {
        _id: msg._id,
        content: msg.deletedAt ? "[deleted]" : msg.content,
        createdAt: new Date(msg._creationTime),
        senderId: isSystem ? "" : msg.senderId,
        senderName: isSystem ? "" : (msg.sender?.name ?? ""),
        senderImage: isSystem ? undefined : (msg.sender?.image ?? undefined),
        isSystem,
        isDeleted: !!msg.deletedAt,
        isEdited: !!msg.editedAt && !msg.deletedAt,
        isPinned: !!msg.pinnedAt,
        isPending: isOptimistic,
        imageUrl:
            msg.attachmentType === "image" && msg.attachmentUrl
                ? msg.attachmentUrl
                : undefined,
        replyToId: msg.replyToId ?? undefined,
        reactions: msg.reactions ?? [],
        original: msg,
    };
}
