import { useCallback, useRef, useState } from "react";
import { X, UserPlus, Loader2 } from "lucide-react";
import {
    Credenza,
    CredenzaBody,
    CredenzaContent,
    CredenzaDescription,
    CredenzaFooter,
    CredenzaHeader,
    CredenzaTitle,
} from "@/components/ui/credenza";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSendInvite } from "../../hooks/use-admin-requests";
import type { Id } from "@backend/authDataModel";
import { toast } from "sonner";

interface InviteMembersModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orgId: Id<"organization">;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function InviteMembersModal({
    open,
    onOpenChange,
    orgId,
}: InviteMembersModalProps) {
    const [input, setInput] = useState("");
    const [emails, setEmails] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const { mutate: sendInvite, isPending } = useSendInvite();

    const addEmail = useCallback((raw: string) => {
        const email = raw.trim().toLowerCase();
        if (!email) return;
        if (!EMAIL_RE.test(email)) {
            setError("Invalid email address.");
            return;
        }
        setEmails((prev) => {
            if (prev.includes(email)) {
                setError("Email already added.");
                return prev;
            }
            setError(null);
            return [...prev, email];
        });
        setInput("");
    }, []);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter" || e.key === "," || e.key === " ") {
                e.preventDefault();
                addEmail(input);
            } else if (e.key === "Backspace" && !input) {
                setEmails((prev) => prev.slice(0, -1));
                setError(null);
            }
        },
        [input, addEmail]
    );

    const handleRemove = useCallback((email: string) => {
        setEmails((prev) => prev.filter((e) => e !== email));
        setError(null);
    }, []);

    const handleSend = useCallback(async () => {
        const pending = input.trim().toLowerCase();
        const finalEmails = pending && EMAIL_RE.test(pending) && !emails.includes(pending)
            ? [...emails, pending]
            : emails;

        if (finalEmails.length === 0) return;

        try {
            const result = await sendInvite({ orgId, emails: finalEmails });
            if (result) {
                const { invited, skipped } = result;
                if (invited.length > 0) {
                    toast.success(
                        `Invited ${invited.length} ${invited.length === 1 ? "user" : "users"}`
                    );
                }
                for (const s of skipped) {
                    toast.warning(s.reason);
                }
            }
            setEmails([]);
            setInput("");
            setError(null);
            onOpenChange(false);
        } catch {
            toast.error("Failed to send invites");
        }
    }, [input, emails, orgId, sendInvite, onOpenChange]);

    const handleBlur = useCallback(() => {
        if (input.trim()) addEmail(input);
    }, [input, addEmail]);

    const totalCount = emails.length + (
        input.trim() && EMAIL_RE.test(input.trim()) && !emails.includes(input.trim().toLowerCase()) ? 1 : 0
    );

    return (
        <Credenza
            open={open}
            onOpenChange={(next) => {
                if (!next) {
                    setEmails([]);
                    setInput("");
                    setError(null);
                }
                onOpenChange(next);
            }}
        >
            <CredenzaContent className="sm:max-w-md">
                <CredenzaHeader>
                    <CredenzaTitle>Invite Members</CredenzaTitle>
                    <CredenzaDescription>
                        Enter email addresses to invite. Press Enter, Space, or comma to add each one.
                    </CredenzaDescription>
                </CredenzaHeader>

                <CredenzaBody className="space-y-3">
                    <div
                        className="flex min-h-10 flex-wrap gap-1.5 rounded-md border border-input bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-ring cursor-text"
                        onClick={() => inputRef.current?.focus()}
                    >
                        {emails.map((email) => (
                            <Badge key={email} variant="secondary" className="gap-1 pr-1">
                                <span className="max-w-40 truncate">{email}</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemove(email);
                                    }}
                                    className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                                    aria-label={`Remove ${email}`}
                                >
                                    <X className="size-3" />
                                </button>
                            </Badge>
                        ))}
                        <Input
                            ref={inputRef}
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                                setError(null);
                            }}
                            onKeyDown={handleKeyDown}
                            onBlur={handleBlur}
                            placeholder={emails.length === 0 ? "name@example.com" : ""}
                            className="h-auto min-w-32 flex-1 border-none p-0 shadow-none focus-visible:ring-0"
                            autoFocus
                        />
                    </div>

                    {error && (
                        <p className="text-xs text-destructive">{error}</p>
                    )}
                </CredenzaBody>

                <CredenzaFooter>
                    <Button
                        onClick={handleSend}
                        disabled={totalCount === 0 || isPending}
                        className="w-full gap-2"
                    >
                        {isPending ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <UserPlus className="size-4" />
                        )}
                        {isPending
                            ? "Sending..."
                            : `Invite${totalCount > 0 ? ` (${totalCount})` : ""}`}
                    </Button>
                </CredenzaFooter>
            </CredenzaContent>
        </Credenza>
    );
}
