import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
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
    expenseId?: Id<"expense">;
    expenseTitle?: string;
}

export function SettleUpModal({
    open,
    onOpenChange,
    tripId,
    toUserId,
    toUsername,
    amount,
    expenseId,
    expenseTitle,
}: SettleUpModalProps) {
    const { mutate: createSettlement, isPending } = useCreateSettlement();
    const [note, setNote] = useState("");
    const [settleAmount, setSettleAmount] = useState(amount);

    useEffect(() => {
        setSettleAmount(amount);
    }, [amount]);

    const isPartial = settleAmount < amount - 0.01;
    const isValid = settleAmount > 0 && settleAmount <= amount + 0.01;

    const handleSubmit = async () => {
        if (!toUserId || !isValid) return;

        try {
            await createSettlement({
                tripId,
                toUserId,
                amount: settleAmount,
                note: note.trim() || undefined,
                expenseId,
            });
            toast.success(
                isPartial
                    ? `Partial payment of ₹${settleAmount.toFixed(0)} recorded!`
                    : "Settlement recorded!"
            );
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
                    <CredenzaTitle>
                        {expenseTitle ? `Settle: ${expenseTitle}` : "Settle Up"}
                    </CredenzaTitle>
                </CredenzaHeader>

                <CredenzaBody className="space-y-4">
                    <div className="flex flex-col items-center gap-3 rounded-lg bg-muted/50 py-5">
                        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                            <HandCoins className="size-6 text-primary" />
                        </div>
                        <div className="text-center">
                            <p className="mt-1 text-sm text-muted-foreground">
                                to @{toUsername}
                            </p>
                        </div>
                    </div>

                    <Field>
                        <FieldLabel>Amount</FieldLabel>
                        <FieldContent>
                            <div className="relative">
                                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                                    ₹
                                </span>
                                <Input
                                    type="number"
                                    value={settleAmount}
                                    onChange={(e) =>
                                        setSettleAmount(
                                            Number.parseFloat(e.target.value) ||
                                                0
                                        )
                                    }
                                    min={0.01}
                                    max={amount}
                                    step={0.01}
                                    className="pl-7 text-lg font-semibold tabular-nums"
                                />
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {isPartial ? (
                                    <span className="text-amber-600 dark:text-amber-400">
                                        Partial — ₹
                                        {(amount - settleAmount).toFixed(2)}{" "}
                                        will remain
                                    </span>
                                ) : (
                                    `Full amount: ₹${amount.toFixed(2)}`
                                )}
                            </p>
                        </FieldContent>
                    </Field>

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
                        disabled={isPending || !isValid}
                        className="flex-1"
                    >
                        {isPending ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            `Pay ₹${settleAmount.toFixed(2)}`
                        )}
                    </Button>
                </CredenzaFooter>
            </CredenzaContent>
        </Credenza>
    );
}
