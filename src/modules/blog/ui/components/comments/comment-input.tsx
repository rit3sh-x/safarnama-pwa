import { useState, useRef, useEffect } from "react";
import { AlertCircleIcon, SendHorizontalIcon } from "lucide-react";
import { useAuthenticatedUser } from "@/modules/auth/hooks/use-authentication";
import { stringToHex } from "@/lib/utils";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ProfanityTextarea } from "./profanity-textarea";

interface CommentInputProps {
    onSubmit: (content: string) => void | Promise<void>;
    onCancel?: () => void;
    placeholder?: string;
    autoFocus?: boolean;
    initialValue?: string;
    isPending?: boolean;
    error?: string | null;
}

export function CommentInput({
    onSubmit,
    onCancel,
    placeholder = "Add a comment...",
    autoFocus = false,
    initialValue = "",
    isPending = false,
    error: externalError = null,
}: CommentInputProps) {
    const { user } = useAuthenticatedUser();
    const [value, setValue] = useState(initialValue);
    const [focused, setFocused] = useState(autoFocus);
    const [clientError, setClientError] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const displayError = clientError || externalError;

    useEffect(() => {
        if (autoFocus) textareaRef.current?.focus();
    }, [autoFocus]);

    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
    }, [value]);

    const handleSubmit = async () => {
        const trimmed = value.trim();
        if (!trimmed) return;
        setClientError(null);

        const { checkProfanity } = await import("@/modules/blog/lib/profanity");
        const check = await checkProfanity(trimmed);
        if (check.hasProfanity) {
            const words = check.detectedWords.join(", ");
            setClientError(`Remove flagged words: ${words}`);
            return;
        }

        try {
            await onSubmit(trimmed);
            setValue("");
            setFocused(false);
        } catch (err) {
            const msg =
                err instanceof Error ? err.message : "Failed to post comment";
            setClientError(msg);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleSubmit();
        }
        if (e.key === "Escape" && onCancel) {
            onCancel();
        }
    };

    const { bg: avatarBg, text: avatarText } = stringToHex(user.username);

    return (
        <div className="flex gap-3">
            <Avatar className="size-8 shrink-0">
                {user.image ? (
                    <AvatarImage src={user.image} alt={user.username} />
                ) : (
                    <AvatarFallback
                        className="text-xs font-bold"
                        style={{ backgroundColor: avatarBg, color: avatarText }}
                    >
                        {user.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                )}
            </Avatar>

            <div className="flex-1">
                <ProfanityTextarea
                    ref={textareaRef}
                    aria-label={placeholder}
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value);
                        if (clientError) setClientError(null);
                    }}
                    onFocus={() => setFocused(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    rows={1}
                    className="w-full resize-none border-b border-border bg-transparent pb-1.5 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-foreground"
                />

                {displayError && (
                    <p className="mt-1.5 flex items-center gap-1 text-xs text-destructive">
                        <AlertCircleIcon className="size-3 shrink-0" />
                        {displayError}
                    </p>
                )}

                {(focused || value) && (
                    <div className="mt-2 flex justify-end gap-2">
                        {onCancel && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setValue(initialValue);
                                    setFocused(false);
                                    onCancel();
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
    );
}
