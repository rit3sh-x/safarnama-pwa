import { useCallback, useState } from "react";
import { CalendarDaysIcon, Loader2Icon } from "lucide-react";
import {
    Credenza,
    CredenzaBody,
    CredenzaClose,
    CredenzaContent,
    CredenzaDescription,
    CredenzaFooter,
    CredenzaHeader,
    CredenzaTitle,
} from "@/components/ui/credenza";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
    Field,
    FieldContent,
    FieldError,
    FieldLabel,
} from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useCreateExpense } from "../../hooks/use-expenses";
import { toast } from "sonner";
import type { Id } from "@backend/dataModel";

type SplitType = "equal" | "exact" | "percentage" | "payer_only";

interface Member {
    userId: string;
    username: string;
}

interface AddExpenseModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tripId: Id<"trip">;
    members: Member[];
    currentUserId: string;
}

const SPLIT_OPTIONS: { value: SplitType; label: string }[] = [
    { value: "equal", label: "Equal" },
    { value: "exact", label: "Exact amounts" },
    { value: "percentage", label: "Percentage" },
    { value: "payer_only", label: "Payer only" },
];

function formatDateLabel(date: Date) {
    return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export function AddExpenseModal({
    open,
    onOpenChange,
    tripId,
    members,
    currentUserId,
}: AddExpenseModalProps) {
    const { mutate: createExpense, isPending } = useCreateExpense();

    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [paidBy, setPaidBy] = useState(currentUserId);
    const [date, setDate] = useState<Date>(new Date());
    const [notes, setNotes] = useState("");
    const [splitType, setSplitType] = useState<SplitType>("equal");
    const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
        () => new Set(members.map((m) => m.userId))
    );
    const [exactAmounts, setExactAmounts] = useState<Record<string, string>>(
        {}
    );
    const [percentages, setPercentages] = useState<Record<string, string>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});

    const resetForm = useCallback(() => {
        setTitle("");
        setAmount("");
        setPaidBy(currentUserId);
        setDate(new Date());
        setNotes("");
        setSplitType("equal");
        setSelectedMembers(new Set(members.map((m) => m.userId)));
        setExactAmounts({});
        setPercentages({});
        setErrors({});
    }, [currentUserId, members]);

    const toggleMember = useCallback((userId: string) => {
        setSelectedMembers((prev) => {
            const next = new Set(prev);
            if (next.has(userId)) next.delete(userId);
            else next.add(userId);
            return next;
        });
    }, []);

    const computeSplits = useCallback(() => {
        const totalAmount = Number.parseFloat(amount);
        if (Number.isNaN(totalAmount) || totalAmount <= 0) return null;

        const selected = members.filter((m) => selectedMembers.has(m.userId));

        switch (splitType) {
            case "payer_only":
                return [{ userId: paidBy, owedAmount: totalAmount }];

            case "equal": {
                if (selected.length === 0) return null;
                const share =
                    Math.round((totalAmount / selected.length) * 100) / 100;
                const remainder =
                    Math.round((totalAmount - share * selected.length) * 100) /
                    100;
                return selected.map((m, i) => ({
                    userId: m.userId,
                    owedAmount: i === 0 ? share + remainder : share,
                }));
            }

            case "exact": {
                const splits = selected.map((m) => ({
                    userId: m.userId,
                    owedAmount:
                        Number.parseFloat(exactAmounts[m.userId] ?? "0") || 0,
                }));
                const sum = splits.reduce((s, x) => s + x.owedAmount, 0);
                const diff = Math.abs(totalAmount - sum);
                if (diff > 0.01) return null;
                return splits;
            }

            case "percentage": {
                const splits = selected.map((m) => {
                    const pct =
                        Number.parseFloat(percentages[m.userId] ?? "0") || 0;
                    return {
                        userId: m.userId,
                        owedAmount: Math.round(totalAmount * pct) / 100,
                        percentage: pct,
                    };
                });
                const totalPct = splits.reduce(
                    (s, x) => s + (x.percentage ?? 0),
                    0
                );
                if (Math.abs(totalPct - 100) > 0.01) return null;
                return splits;
            }

            default:
                return null;
        }
    }, [
        amount,
        splitType,
        selectedMembers,
        members,
        paidBy,
        exactAmounts,
        percentages,
    ]);

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!title.trim()) errs.title = "Title is required";
        const totalAmount = Number.parseFloat(amount);
        if (Number.isNaN(totalAmount) || totalAmount <= 0)
            errs.amount = "Enter a valid amount";
        if (!paidBy) errs.paidBy = "Select who paid";

        if (splitType !== "payer_only" && selectedMembers.size === 0)
            errs.members = "Select at least one member";

        if (splitType === "exact") {
            const sum = Array.from(selectedMembers).reduce(
                (s, id) =>
                    s + (Number.parseFloat(exactAmounts[id] ?? "0") || 0),
                0
            );
            if (Math.abs(totalAmount - sum) > 0.01)
                errs.split = `Amounts must add up to ₹${totalAmount.toFixed(2)} (currently ₹${sum.toFixed(2)})`;
        }

        if (splitType === "percentage") {
            const totalPct = Array.from(selectedMembers).reduce(
                (s, id) => s + (Number.parseFloat(percentages[id] ?? "0") || 0),
                0
            );
            if (Math.abs(totalPct - 100) > 0.01)
                errs.split = `Percentages must add up to 100% (currently ${totalPct.toFixed(1)}%)`;
        }

        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        const splits = computeSplits();
        if (!splits) {
            toast.error("Invalid split configuration");
            return;
        }

        try {
            await createExpense({
                tripId,
                title: title.trim(),
                amount: Number.parseFloat(amount),
                paidBy,
                date: date.getTime(),
                notes: notes.trim() || undefined,
                splitType,
                splits,
            });
            toast.success("Expense added!");
            resetForm();
            onOpenChange(false);
        } catch {
            toast.error("Failed to add expense");
        }
    };

    const totalAmount = Number.parseFloat(amount) || 0;
    const selected = members.filter((m) => selectedMembers.has(m.userId));

    return (
        <Credenza
            open={open}
            onOpenChange={(next) => {
                if (!next) resetForm();
                onOpenChange(next);
            }}
        >
            <CredenzaContent className="max-h-[90vh] sm:max-w-lg">
                <CredenzaHeader>
                    <CredenzaTitle>Add Expense</CredenzaTitle>
                    <CredenzaDescription>
                        Split an expense with trip members
                    </CredenzaDescription>
                </CredenzaHeader>

                <CredenzaBody className="space-y-4 overflow-y-auto">
                    <Field>
                        <FieldLabel>Title</FieldLabel>
                        <FieldContent>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Dinner at restaurant"
                            />
                        </FieldContent>
                        {errors.title && (
                            <FieldError>{errors.title}</FieldError>
                        )}
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
                        {errors.amount && (
                            <FieldError>{errors.amount}</FieldError>
                        )}
                    </Field>

                    <Field>
                        <FieldLabel>Paid by</FieldLabel>
                        <FieldContent>
                            <Select
                                value={paidBy}
                                onValueChange={(value) =>
                                    value && setPaidBy(value)
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Who paid?" />
                                </SelectTrigger>
                                <SelectContent>
                                    {members.map((m) => (
                                        <SelectItem
                                            key={m.userId}
                                            value={m.userId}
                                        >
                                            {m.userId === currentUserId
                                                ? "You"
                                                : `@${m.username}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FieldContent>
                    </Field>

                    <Field>
                        <FieldLabel>Date</FieldLabel>
                        <Popover>
                            <div className="flex items-center gap-2">
                                <PopoverTrigger
                                    render={
                                        <Button
                                            variant="outline"
                                            className="flex-1 justify-start gap-2 font-normal"
                                        />
                                    }
                                >
                                    <CalendarDaysIcon className="size-4 text-muted-foreground" />
                                    {formatDateLabel(date)}
                                </PopoverTrigger>
                            </div>
                            <PopoverContent
                                className="w-auto p-0"
                                align="start"
                            >
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={(d) => d && setDate(d)}
                                    numberOfMonths={1}
                                />
                            </PopoverContent>
                        </Popover>
                    </Field>

                    <Field>
                        <FieldLabel>Notes (optional)</FieldLabel>
                        <FieldContent>
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Any additional details"
                                rows={2}
                            />
                        </FieldContent>
                    </Field>

                    <Field>
                        <FieldLabel>Split type</FieldLabel>
                        <FieldContent>
                            <div className="flex flex-wrap gap-1.5">
                                {SPLIT_OPTIONS.map((opt) => (
                                    <Button
                                        key={opt.value}
                                        size="sm"
                                        variant={
                                            splitType === opt.value
                                                ? "default"
                                                : "outline"
                                        }
                                        onClick={() => setSplitType(opt.value)}
                                        type="button"
                                    >
                                        {opt.label}
                                    </Button>
                                ))}
                            </div>
                        </FieldContent>
                    </Field>

                    {splitType !== "payer_only" && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Split between</p>
                            {errors.members && (
                                <FieldError>{errors.members}</FieldError>
                            )}

                            <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border p-2">
                                {members.map((m) => {
                                    const checked = selectedMembers.has(
                                        m.userId
                                    );
                                    const isMe = m.userId === currentUserId;

                                    return (
                                        <div
                                            key={m.userId}
                                            className="flex items-center gap-3 rounded-md px-2 py-1.5"
                                        >
                                            <Checkbox
                                                checked={checked}
                                                onCheckedChange={() =>
                                                    toggleMember(m.userId)
                                                }
                                            />
                                            <Label className="flex-1 cursor-pointer text-sm">
                                                {isMe
                                                    ? "You"
                                                    : `@${m.username}`}
                                            </Label>

                                            {checked &&
                                                splitType === "exact" && (
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        className="h-8 w-24"
                                                        placeholder="₹0.00"
                                                        value={
                                                            exactAmounts[
                                                                m.userId
                                                            ] ?? ""
                                                        }
                                                        onChange={(e) =>
                                                            setExactAmounts(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    [m.userId]:
                                                                        e.target
                                                                            .value,
                                                                })
                                                            )
                                                        }
                                                    />
                                                )}

                                            {checked &&
                                                splitType === "percentage" && (
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        step="0.1"
                                                        className="h-8 w-20"
                                                        placeholder="%"
                                                        value={
                                                            percentages[
                                                                m.userId
                                                            ] ?? ""
                                                        }
                                                        onChange={(e) =>
                                                            setPercentages(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    [m.userId]:
                                                                        e.target
                                                                            .value,
                                                                })
                                                            )
                                                        }
                                                    />
                                                )}

                                            {checked &&
                                                splitType === "equal" &&
                                                totalAmount > 0 && (
                                                    <span className="text-xs text-muted-foreground">
                                                        ₹
                                                        {(
                                                            totalAmount /
                                                            selected.length
                                                        ).toFixed(2)}
                                                    </span>
                                                )}
                                        </div>
                                    );
                                })}
                            </div>

                            {errors.split && (
                                <FieldError>{errors.split}</FieldError>
                            )}
                        </div>
                    )}
                </CredenzaBody>

                <CredenzaFooter className="flex-row gap-3">
                    <CredenzaClose asChild>
                        <Button variant="outline" className="flex-1">
                            Cancel
                        </Button>
                    </CredenzaClose>
                    <Button
                        className="flex-1"
                        onClick={handleSubmit}
                        disabled={isPending}
                    >
                        {isPending ? (
                            <Loader2Icon className="size-4 animate-spin" />
                        ) : (
                            "Add Expense"
                        )}
                    </Button>
                </CredenzaFooter>
            </CredenzaContent>
        </Credenza>
    );
}
