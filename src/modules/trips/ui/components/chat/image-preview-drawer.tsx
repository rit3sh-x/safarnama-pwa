import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    SendHorizontalIcon,
    XIcon,
    Loader2Icon,
    SmileIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import EmojiPickerReact, { EmojiStyle, Theme } from "emoji-picker-react";
import { useTheme } from "@/hooks/use-theme";

interface ImagePreviewDrawerProps {
    file: File | null;
    isUploading: boolean;
    onSend: (file: File, caption: string) => void;
    onClose: () => void;
}

export function ImagePreviewDrawer({
    file,
    isUploading,
    onSend,
    onClose,
}: ImagePreviewDrawerProps) {
    const [caption, setCaption] = useState("");
    const [showEmoji, setShowEmoji] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const previewUrl = useMemo(() => {
        if (!file) return null;
        return URL.createObjectURL(file);
    }, [file]);

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    useEffect(() => {
        if (file) {
            setTimeout(() => textareaRef.current?.focus(), 100);
        }
    }, [file]);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.style.height = "auto";
        textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`;
    }, [caption]);

    const handleSend = useCallback(() => {
        if (!file) return;
        onSend(file, caption.trim());
        setCaption("");
        setShowEmoji(false);
    }, [file, caption, onSend]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        },
        [handleSend]
    );

    const handleEmojiSelect = useCallback(
        (emoji: string) => {
            const textarea = textareaRef.current;
            if (!textarea) {
                setCaption((prev) => prev + emoji);
                return;
            }
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const before = caption.slice(0, start);
            const after = caption.slice(end);
            setCaption(before + emoji + after);
            requestAnimationFrame(() => {
                textarea.selectionStart = textarea.selectionEnd =
                    start + emoji.length;
                textarea.focus();
            });
        },
        [caption]
    );

    return (
        <AnimatePresence>
            {file && (
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="fixed inset-0 top-14 z-50 flex flex-col bg-background"
                >
                    <div className="flex items-center justify-between border-b px-4 py-3">
                        <h2 className="text-base font-semibold">Send Image</h2>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                                setCaption("");
                                setShowEmoji(false);
                                onClose();
                            }}
                        >
                            <XIcon className="size-4" />
                        </Button>
                    </div>

                    <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4">
                        {previewUrl && (
                            <div className="flex flex-1 items-center justify-center overflow-hidden rounded-xl bg-muted/50">
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    className="max-h-[48vh] max-w-full rounded-xl object-contain"
                                />
                            </div>
                        )}

                        <div className="relative flex items-end gap-2 border-t pt-2">
                            <div className="min-w-0 flex-1">
                                <textarea
                                    ref={textareaRef}
                                    value={caption}
                                    onChange={(e) => setCaption(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Add a caption..."
                                    rows={1}
                                    disabled={isUploading}
                                    className="block w-full resize-none rounded-2xl border border-input bg-input/30 px-4 py-2.5 text-sm leading-relaxed text-foreground transition-colors outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring/30 disabled:opacity-50"
                                />
                            </div>

                            <div className="relative mb-0.5">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 shrink-0 rounded-full"
                                    onClick={() => setShowEmoji((v) => !v)}
                                >
                                    <SmileIcon className="size-5 text-muted-foreground" />
                                </Button>

                                {showEmoji && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-50"
                                            onClick={() => setShowEmoji(false)}
                                        />
                                        <div className="absolute right-0 bottom-full z-50 mb-2 rounded-2xl bg-popover shadow-2xl ring-1 ring-foreground/5">
                                            <EmojiPickerReact
                                                onEmojiClick={(emojiData) => {
                                                    handleEmojiSelect(
                                                        emojiData.emoji
                                                    );
                                                    setShowEmoji(false);
                                                }}
                                                theme={
                                                    isDark
                                                        ? Theme.DARK
                                                        : Theme.LIGHT
                                                }
                                                emojiStyle={EmojiStyle.NATIVE}
                                                lazyLoadEmojis
                                                searchPlaceHolder="Search emoji..."
                                                width={320}
                                                height={400}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            <Button
                                size="icon"
                                className="mb-0.5 h-9 w-9 shrink-0 rounded-full"
                                onClick={handleSend}
                                disabled={isUploading}
                            >
                                {isUploading ? (
                                    <Loader2Icon className="size-5 animate-spin" />
                                ) : (
                                    <SendHorizontalIcon className="size-5" />
                                )}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
