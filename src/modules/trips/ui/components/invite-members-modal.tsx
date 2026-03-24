import { useCallback, useState } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUserSearch } from "../../hooks/use-user-search";
import { useSendInvite } from "../../hooks/use-admin-requests";
import type { Id } from "@backend/authDataModel";
import { toast } from "sonner";
import type { SelectedUser } from "../../types";

interface InviteMembersModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orgId: Id<"organization">;
}

export function InviteMembersModal({
    open,
    onOpenChange,
    orgId,
}: InviteMembersModalProps) {
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<SelectedUser[]>([]);
    const { users, isLoading } = useUserSearch(
        query,
        selected.map((s) => s.id)
    );
    const { mutate: sendInvite, isPending } = useSendInvite();

    const handleSelect = useCallback((user: SelectedUser) => {
        setSelected((prev) => {
            if (prev.some((u) => u.id === user.id)) return prev;
            return [...prev, user];
        });
        setQuery("");
    }, []);

    const handleRemove = useCallback((userId: string) => {
        setSelected((prev) => prev.filter((u) => u.id !== userId));
    }, []);

    const handleSend = useCallback(async () => {
        if (selected.length === 0) return;
        try {
            const result = await sendInvite({
                orgId,
                userIds: selected.map((u) => u.id),
            });
            if (result) {
                const { invited, skipped } = result;
                if (invited.length > 0) {
                    toast.success(
                        `Invited ${invited.length} ${invited.length === 1 ? "user" : "users"}`
                    );
                }
                if (skipped.length > 0) {
                    for (const s of skipped) {
                        toast.warning(s.reason);
                    }
                }
            }
            setSelected([]);
            setQuery("");
            onOpenChange(false);
        } catch {
            toast.error("Failed to send invites");
        }
    }, [selected, orgId, sendInvite, onOpenChange]);

    return (
        <Credenza open={open} onOpenChange={onOpenChange}>
            <CredenzaContent className="sm:max-w-md">
                <CredenzaHeader>
                    <CredenzaTitle>Invite Members</CredenzaTitle>
                    <CredenzaDescription>
                        Search by name or username to invite
                    </CredenzaDescription>
                </CredenzaHeader>

                <CredenzaBody className="space-y-3">
                    {selected.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {selected.map((user) => (
                                <Badge
                                    key={user.id}
                                    variant="secondary"
                                    className="gap-1 pr-1"
                                >
                                    <span className="max-w-24 truncate">
                                        {user.name}
                                    </span>
                                    <Button
                                        onClick={() => handleRemove(user.id)}
                                        className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                                    >
                                        <X className="size-3" />
                                    </Button>
                                </Badge>
                            ))}
                        </div>
                    )}

                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search users..."
                        autoFocus
                    />

                    <ScrollArea className="max-h-60">
                        {isLoading && (
                            <div className="flex items-center justify-center py-6">
                                <Loader2 className="size-5 animate-spin text-muted-foreground" />
                            </div>
                        )}

                        {!isLoading && query.trim() && users.length === 0 && (
                            <p className="py-6 text-center text-sm text-muted-foreground">
                                No users found
                            </p>
                        )}

                        {users.map((user) => (
                            <button
                                key={user.id}
                                onClick={() => handleSelect(user)}
                                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/50"
                            >
                                <Avatar size="sm">
                                    {user.image && (
                                        <AvatarImage src={user.image} />
                                    )}
                                    <AvatarFallback>
                                        {user.name
                                            .split(" ")
                                            .slice(0, 2)
                                            .map(
                                                (w) => w[0]?.toUpperCase() ?? ""
                                            )
                                            .join("")}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">
                                        {user.name}
                                    </p>
                                    <p className="truncate text-xs text-muted-foreground">
                                        @{user.username}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </ScrollArea>
                </CredenzaBody>

                <CredenzaFooter>
                    <Button
                        onClick={handleSend}
                        disabled={selected.length === 0 || isPending}
                        className="w-full gap-2"
                    >
                        {isPending ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <UserPlus className="size-4" />
                        )}
                        {isPending
                            ? "Sending..."
                            : `Invite ${selected.length > 0 ? `(${selected.length})` : ""}`}
                    </Button>
                </CredenzaFooter>
            </CredenzaContent>
        </Credenza>
    );
}
