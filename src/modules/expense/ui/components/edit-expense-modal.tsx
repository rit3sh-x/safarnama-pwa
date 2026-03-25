import { useState } from "react";
import { Loader2Icon } from "lucide-react";
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
import { useUpdateExpense } from "../../hooks/use-expenses";
import { toast } from "sonner";
import type { Id } from "@backend/dataModel";

interface EditExpenseModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    expense: {
        _id: Id<"expense">;
        title: string;
        amount: number;
        date: number;
        notes?: string;
    };
}

export function EditExpenseModal({
    open,
    onOpenChange,
    expense,
}: EditExpenseModalProps) {
    const { mutate: updateExpense, isPending } = useUpdateExpense();

    const [title, setTitle] = useState(expense.title);
    const [amount, setAmount] = useState(expense.amount.toString());
    const [date, setDate] = useState(
        new Date(expense.date).toISOString().split("T")[0]
    );
    const [notes, setNotes] = useState(expense.notes ?? "");

    const handleSubmit = async () => {
        const parsedAmount = Number.parseFloat(amount);
        if (!title.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
            toast.error("Please enter a valid title and amount");
            return;
        }

        await updateExpense({
            expenseId: expense._id,
            title: title.trim(),
            amount: parsedAmount,
            date: new Date(date).getTime(),
            notes: notes.trim() || undefined,
        });

        toast.success("Expense updated");
        onOpenChange(false);
    };

    return (
        <Credenza open={open} onOpenChange={onOpenChange}>
            <CredenzaContent className="sm:max-w-md">
                <CredenzaHeader>
                    <CredenzaTitle>Edit Expense</CredenzaTitle>
                </CredenzaHeader>

                <CredenzaBody className="space-y-4">
                    <Field>
                        <FieldLabel>Title</FieldLabel>
                        <FieldContent>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Dinner, Taxi, etc."
                            />
                        </FieldContent>
                    </Field>

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
                        <FieldLabel>Date</FieldLabel>
                        <FieldContent>
                            <Input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </FieldContent>
                    </Field>

                    <Field>
                        <FieldLabel>Notes (optional)</FieldLabel>
                        <FieldContent>
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add a note..."
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
                            <Loader2Icon className="size-4 animate-spin" />
                        ) : (
                            "Save Changes"
                        )}
                    </Button>
                </CredenzaFooter>
            </CredenzaContent>
        </Credenza>
    );
}
