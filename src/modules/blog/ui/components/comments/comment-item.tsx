import { useState } from "react";
import { PencilIcon, Trash2Icon, CornerDownRightIcon } from "lucide-react";
import { stringToHex } from "@/lib/utils";
import { useAuthenticatedUser } from "@/modules/auth/hooks/use-authentication";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CommentInput } from "./comment-input";
import type { Id } from "@backend/dataModel";

export interface CommentData {
    _id: Id<"blogComment">;
    _creationTime: number;
    blogId: Id<"blog">;
    authorId: string;
    content: string;
    parentId?: Id<"blogComment">;
    editedAt?: number;
    deletedAt?: number;
    author: { username: string; image?: string | null };
    replyCount?: number;
}

interface CommentItemProps {
    comment: CommentData;
    onReply: (comment: CommentData) => void;
    onEdit: (commentId: Id<"blogComment">, content: string) => Promise<void>;
    onDelete: (commentId: Id<"blogComment">) => Promise<void>;
    isEditPending?: boolean;
}

function relativeTime(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    return `${Math.floor(months / 12)}y ago`;
}

function renderContent(content: string) {
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, i) =>
        part.startsWith("@") ? (
            <span key={i} className="font-medium text-primary">
                {part}
            </span>
        ) : (
            <span key={i}>{part}</span>
        )
    );
}

export function CommentItem({
    comment,
    onReply,
    onEdit,
    onDelete,
    isEditPending,
}: CommentItemProps) {
    const { user } = useAuthenticatedUser();
    const [isEditing, setIsEditing] = useState(false);
    const isOwn = user._id === comment.authorId;
    const isDeleted = !!comment.deletedAt;
    const avatarBg = stringToHex(comment.author.username);

    if (isDeleted) {
        return (
            <div role="status" className="flex gap-3 py-2">
                <div className="size-8 shrink-0" />
                <p className="text-sm text-muted-foreground/60 italic">
                    This comment has been deleted
                </p>
            </div>
        );
    }

    if (isEditing) {
        return (
            <div className="py-2">
                <CommentInput
                    initialValue={comment.content}
                    autoFocus
                    isPending={isEditPending}
                    onSubmit={async (content) => {
                        await onEdit(comment._id, content);
                        setIsEditing(false);
                    }}
                    onCancel={() => setIsEditing(false)}
                />
            </div>
        );
    }

    return (
        <div className="flex gap-3 py-2">
            <Avatar className="size-8 shrink-0">
                {comment.author.image ? (
                    <AvatarImage
                        src={comment.author.image}
                        alt={comment.author.username}
                    />
                ) : (
                    <AvatarFallback
                        className="text-xs text-white"
                        style={{ backgroundColor: avatarBg }}
                    >
                        {comment.author.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                )}
            </Avatar>

            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                        @{comment.author.username}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {relativeTime(comment._creationTime)}
                    </span>
                    {comment.editedAt && (
                        <span className="text-xs text-muted-foreground">
                            (edited)
                        </span>
                    )}
                </div>

                <p className="mt-0.5 text-sm leading-relaxed wrap-break-word whitespace-pre-wrap">
                    {renderContent(comment.content)}
                </p>

                <div className="mt-1 flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 px-2 text-xs text-muted-foreground"
                        onClick={() => onReply(comment)}
                    >
                        <CornerDownRightIcon className="size-3" />
                        Reply
                    </Button>
                    {isOwn && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1 px-2 text-xs text-muted-foreground"
                                onClick={() => setIsEditing(true)}
                            >
                                <PencilIcon className="size-3" />
                                Edit
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1 px-2 text-xs text-muted-foreground transition-colors hover:text-destructive"
                                onClick={() => onDelete(comment._id)}
                            >
                                <Trash2Icon className="size-3" />
                                Delete
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
