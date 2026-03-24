import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type KeyboardEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    SendHorizontalIcon,
    PaperclipIcon,
    XIcon,
    ReplyIcon,
    PencilIcon,
    Loader2Icon,
} from "lucide-react";
import { EmojiPicker } from "./emoji-picker";
import { ImagePreviewDrawer } from "./image-preview-drawer";
import type { ChatMessage } from "./types";

interface ChatInputToolbarProps {
    onSend: (text: string) => void;
    onSendImage: (url: string, caption?: string) => void;
    replyTo: ChatMessage | null;
    editingMessage: ChatMessage | null;
    isUploading: boolean;
    onClearReply: () => void;
    onClearEdit: () => void;
    onUploadFile: (file: File) => Promise<{ url: string | null } | null>;
}

export function ChatInputToolbar({
    onSend,
    onSendImage,
    replyTo,
    editingMessage,
    isUploading,
    onClearReply,
    onClearEdit,
    onUploadFile,
}: ChatInputToolbarProps) {
    const [composeText, setComposeText] = useState("");
    const [editDrafts, setEditDrafts] = useState<Record<string, string>>({});
    const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const activeText = editingMessage
        ? (editDrafts[editingMessage._id] ?? editingMessage.content)
        : composeText;

    const setActiveText = useCallback(
        (value: string) => {
            if (editingMessage) {
                setEditDrafts((prev) => ({
                    ...prev,
                    [editingMessage._id]: value,
                }));
                return;
            }
            setComposeText(value);
        },
        [editingMessage]
    );

    const clearEditDraft = useCallback((id: string) => {
        setEditDrafts((prev) => {
            if (!(id in prev)) return prev;
            const next = { ...prev };
            delete next[id];
            return next;
        });
    }, []);

    useEffect(() => {
        if (editingMessage) {
            textareaRef.current?.focus();
        }
    }, [editingMessage]);

    useEffect(() => {
        if (replyTo) {
            textareaRef.current?.focus();
        }
    }, [replyTo]);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.style.height = "auto";
        textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }, [activeText]);

    const handleSend = useCallback(() => {
        const trimmed = activeText.trim();
        if (!trimmed) return;

        onSend(trimmed);

        if (editingMessage) {
            clearEditDraft(editingMessage._id);
        } else {
            setComposeText("");
        }

        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }
    }, [activeText, onSend, editingMessage, clearEditDraft]);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
            if (e.key === "Escape") {
                if (editingMessage) {
                    clearEditDraft(editingMessage._id);
                    onClearEdit();
                } else if (replyTo) {
                    onClearReply();
                }
            }
        },
        [
            handleSend,
            editingMessage,
            replyTo,
            onClearEdit,
            onClearReply,
            clearEditDraft,
        ]
    );

    const handleEmojiSelect = useCallback(
        (emoji: string) => {
            const textarea = textareaRef.current;
            if (!textarea) {
                setActiveText(activeText + emoji);
                return;
            }

            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const before = activeText.slice(0, start);
            const after = activeText.slice(end);
            const newText = before + emoji + after;
            setActiveText(newText);

            requestAnimationFrame(() => {
                textarea.selectionStart = textarea.selectionEnd =
                    start + emoji.length;
                textarea.focus();
            });
        },
        [activeText, setActiveText]
    );

    const handleFileSelect = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;
            e.target.value = "";
            setPendingImageFile(file);
        },
        []
    );

    const handleImageSend = useCallback(
        async (file: File, caption: string) => {
            const result = await onUploadFile(file);
            if (result?.url) {
                onSendImage(result.url, caption || undefined);
                setPendingImageFile(null);
            }
        },
        [onUploadFile, onSendImage]
    );

    const canSend = activeText.trim().length > 0;

    return (
        <div className="shrink-0 border-t border-border bg-background">
            {replyTo && (
                <div className="flex items-center gap-3 border-b border-border bg-muted/50 px-4 py-2">
                    <ReplyIcon className="size-4 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-primary">
                            {replyTo.senderName}
                        </p>
                        <p className="truncate text-[13px] text-muted-foreground">
                            {replyTo.content}
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={onClearReply}
                    >
                        <XIcon className="size-4 text-muted-foreground" />
                    </Button>
                </div>
            )}

            {editingMessage && (
                <div className="flex items-center gap-3 border-b border-border bg-muted/50 px-4 py-2">
                    <PencilIcon className="size-4 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-primary">
                            Editing message
                        </p>
                        <p className="text-3 truncate text-muted-foreground">
                            {editingMessage.content}
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => {
                            clearEditDraft(editingMessage._id);
                            onClearEdit();
                        }}
                    >
                        <XIcon className="size-4 text-muted-foreground" />
                    </Button>
                </div>
            )}

            {isUploading && !pendingImageFile && (
                <div className="flex items-center justify-center gap-2 border-b border-border bg-muted/50 px-4 py-2">
                    <Loader2Icon className="size-4 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">
                        Uploading image...
                    </span>
                </div>
            )}

            <div className="flex items-end gap-2 px-3 py-3 md:px-4">
                <Button
                    variant="ghost"
                    size="icon"
                    className="mb-0.5 h-9 w-9 shrink-0 rounded-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                >
                    <PaperclipIcon className="size-5 text-muted-foreground" />
                </Button>

                <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                />

                <div className="min-w-0 flex-1">
                    <textarea
                        ref={textareaRef}
                        value={activeText}
                        onChange={(e) => setActiveText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={
                            editingMessage
                                ? "Edit message..."
                                : "Type a message..."
                        }
                        rows={1}
                        className="block w-full resize-none rounded-2xl border border-input bg-input/30 px-4 py-2.5 text-[15px] leading-relaxed text-foreground transition-colors outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring/30"
                    />
                </div>

                <div className="mb-0.5">
                    <EmojiPicker
                        onSelect={handleEmojiSelect}
                        side="top"
                        align="end"
                    />
                </div>

                <Button
                    size="icon"
                    className="mb-0.5 h-9 w-9 shrink-0 rounded-full"
                    onClick={handleSend}
                    disabled={!canSend}
                >
                    <SendHorizontalIcon className="size-5" />
                </Button>
            </div>

            <ImagePreviewDrawer
                file={pendingImageFile}
                isUploading={isUploading}
                onSend={handleImageSend}
                onClose={() => setPendingImageFile(null)}
            />
        </div>
    );
}
