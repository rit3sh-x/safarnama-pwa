import { useState } from "react";
import { Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { useCreateSettlement } from "../../hooks/use-expenses";
import { toast } from "sonner";
import type { Id } from "@backend/dataModel";

interface SettleUpModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tripId: Id<"trip">;
    members: Array<{ userId: string; username: string }>;
    currentUserId: string;
    simplified: Array<{ from: string; to: string; amount: number }>;
}

export function SettleUpModal({
    open,
    onOpenChange,
    tripId,
    members,
    currentUserId,
    simplified,
}: SettleUpModalProps) {
    const { mutate: createSettlement, isPending } = useCreateSettlement();

    const myDebts = simplified.filter((t) => t.from === currentUserId);
    const defaultTo = myDebts[0]?.to ?? "";
    const defaultAmount = myDebts[0]?.amount ?? 0;

    const [toUserId, setToUserId] = useState(defaultTo);
    const [amount, setAmount] = useState(defaultAmount.toString());
    const [note, setNote] = useState("");

    const selectedDebt = myDebts.find((d) => d.to === toUserId);

    const handleSubmit = async () => {
        const parsedAmount = Number.parseFloat(amount);
        if (!toUserId || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
            toast.error("Please enter a valid amount and select a member");
            return;
        }

        try {
            await createSettlement({
                tripId,
                toUserId,
                amount: parsedAmount,
                note: note.trim() || undefined,
            });
            toast.success("Settlement recorded!");
            onOpenChange(false);
            setNote("");
        } catch {
            toast.error("Failed to record settlement");
        }
    };

    const otherMembers = members.filter((m) => m.userId !== currentUserId);

    return (
        <Credenza open={open} onOpenChange={onOpenChange}>
            <CredenzaContent className="sm:max-w-md">
                <CredenzaHeader>
                    <CredenzaTitle>Settle Up</CredenzaTitle>
                    <CredenzaDescription>
                        Record a payment to settle debts
                    </CredenzaDescription>
                </CredenzaHeader>

                <CredenzaBody className="space-y-4">
                    <Field>
                        <FieldLabel>Pay to</FieldLabel>
                        <FieldContent>
                            <Select
                                value={toUserId}
                                onValueChange={(value) =>
                                    value !== null && setToUserId(value)
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select member" />
                                </SelectTrigger>
                                <SelectContent>
                                    {otherMembers.map((m) => (
                                        <SelectItem
                                            key={m.userId}
                                            value={m.userId}
                                        >
                                            @{m.username}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FieldContent>
                    </Field>

                    {selectedDebt && (
                        <p className="text-xs text-muted-foreground">
                            You owe ₹{selectedDebt.amount.toFixed(2)} to @
                            {
                                members.find((m) => m.userId === toUserId)
                                    ?.username
                            }
                        </p>
                    )}

                    <Field>
                        <FieldLabel>Amount (₹)</FieldLabel>
                        <FieldContent>
                            <Input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                            />
                        </FieldContent>
                    </Field>

                    <Field>
                        <FieldLabel>Note (optional)</FieldLabel>
                        <FieldContent>
                            <Textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="e.g. UPI payment"
                                rows={2}
                            />
                        </FieldContent>
                    </Field>
                </CredenzaBody>

                <CredenzaFooter>
                    <Button
                        onClick={handleSubmit}
                        disabled={isPending}
                        className="w-full"
                    >
                        {isPending ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            "Record Payment"
                        )}
                    </Button>
                </CredenzaFooter>
            </CredenzaContent>
        </Credenza>
    );
}
