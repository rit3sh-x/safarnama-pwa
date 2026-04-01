import { useState } from "react";
import { HandCoins, Loader2 } from "lucide-react";
import {
    Credenza,
    CredenzaBody,
    CredenzaContent,
    CredenzaFooter,
    CredenzaHeader,
    CredenzaTitle,
} from "@/components/ui/credenza";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { useCreateSettlement } from "../../hooks/use-expenses";
import { toast } from "sonner";
import type { Id } from "@backend/dataModel";

interface SettleUpModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tripId: Id<"trip">;
    toUserId: string;
    toUsername: string;
    amount: number;
}

export function SettleUpModal({
    open,
    onOpenChange,
    tripId,
    toUserId,
    toUsername,
    amount,
}: SettleUpModalProps) {
    const { mutate: createSettlement, isPending } = useCreateSettlement();
    const [note, setNote] = useState("");

    const handleSubmit = async () => {
        if (!toUserId || amount <= 0) return;

        try {
            await createSettlement({
                tripId,
                toUserId,
                note: note.trim() || undefined,
            });
            toast.success("Settlement recorded!");
            onOpenChange(false);
            setNote("");
        } catch {
            toast.error("Failed to record settlement");
        }
    };

    return (
        <Credenza open={open} onOpenChange={onOpenChange}>
            <CredenzaContent className="sm:max-w-sm">
                <CredenzaHeader>
                    <CredenzaTitle>Settle Up</CredenzaTitle>
                </CredenzaHeader>

                <CredenzaBody className="space-y-4">
                    <div className="flex flex-col items-center gap-3 rounded-lg bg-muted/50 py-5">
                        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                            <HandCoins className="size-6 text-primary" />
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold tabular-nums">
                                ₹{amount.toFixed(2)}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                to @{toUsername}
                            </p>
                        </div>
                    </div>

                    <Field>
                        <FieldLabel>Note (optional)</FieldLabel>
                        <FieldContent>
                            <Textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="e.g. UPI payment, cash"
                                rows={2}
                            />
                        </FieldContent>
                    </Field>
                </CredenzaBody>

                <CredenzaFooter>
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isPending}
                        className="flex-1"
                    >
                        {isPending ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            `Pay ₹${amount.toFixed(2)}`
                        )}
                    </Button>
                </CredenzaFooter>
            </CredenzaContent>
        </Credenza>
    );
}
