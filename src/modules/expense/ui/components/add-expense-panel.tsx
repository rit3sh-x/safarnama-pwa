import React, { useCallback, useState } from "react";
import { CalendarDaysIcon, CheckIcon, Loader2Icon, XIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Credenza,
    CredenzaBody,
    CredenzaContent,
    CredenzaFooter,
    CredenzaHeader,
    CredenzaTitle,
} from "@/components/ui/credenza";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Field,
    FieldContent,
    FieldError,
    FieldLabel,
} from "@/components/ui/field";
import { useCreateExpense } from "../../hooks/use-expenses";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Id } from "@backend/dataModel";

type SplitType = "equal" | "exact" | "percentage" | "payer_only";

interface Member {
    userId: string;
    name: string;
    username: string;
}

interface AddExpensePanelProps {
    open: boolean;
    onClose: () => void;
    tripId: Id<"trip">;
    members: Member[];
    currentUserId: string;
}

const SPLIT_LABELS: Record<SplitType, string> = {
    equal: "Equally",
    exact: "Exact amounts",
    percentage: "By percentage",
    payer_only: "Payer only",
};

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

function MemberCheckList({
    members,
    selectedMembers,
    toggleMember,
    currentUserId,
    renderExtra,
}: {
    members: Member[];
    selectedMembers: Set<string>;
    toggleMember: (userId: string) => void;
    currentUserId: string;
    renderExtra: (m: Member, checked: boolean) => React.ReactNode;
}) {
    return (
        <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border p-2">
            {members.map((m) => {
                const checked = selectedMembers.has(m.userId);
                return (
                    <div
                        key={m.userId}
                        className="flex items-center gap-3 rounded-lg px-2 py-1.5"
                    >
                        <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleMember(m.userId)}
                        />
                        <Label className="flex-1 cursor-pointer text-sm">
                            {m.userId === currentUserId ? "You" : m.name}
                        </Label>
                        {renderExtra(m, checked)}
                    </div>
                );
            })}
        </div>
    );
}

export function AddExpensePanel({
    open,
    onClose,
    tripId,
    members,
    currentUserId,
}: AddExpensePanelProps) {
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

    const [showPaidBy, setShowPaidBy] = useState(false);
    const [showSplit, setShowSplit] = useState(false);

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

    const paidByMember = members.find((m) => m.userId === paidBy);
    const paidByLabel =
        paidBy === currentUserId ? "You" : (paidByMember?.name ?? "Select");

    const totalAmount = Number.parseFloat(amount) || 0;
    const selected = members.filter((m) => selectedMembers.has(m.userId));

    const computeSplits = useCallback(() => {
        if (Number.isNaN(totalAmount) || totalAmount <= 0) return null;

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
                if (Math.abs(totalAmount - sum) > 0.01) return null;
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
    }, [totalAmount, splitType, selected, paidBy, exactAmounts, percentages]);

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!title.trim()) errs.title = "Title is required";
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
                errs.split = `Amounts must add up to ₹${totalAmount.toFixed(2)}`;
        }
        if (splitType === "percentage") {
            const totalPct = Array.from(selectedMembers).reduce(
                (s, id) => s + (Number.parseFloat(percentages[id] ?? "0") || 0),
                0
            );
            if (Math.abs(totalPct - 100) > 0.01)
                errs.split = `Percentages must add up to 100%`;
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
        await createExpense({
            tripId,
            title: title.trim(),
            amount: totalAmount,
            paidBy,
            date: date.getTime(),
            notes: notes.trim() || undefined,
            splitType,
            splits,
        });
        toast.success("Expense added!");
        resetForm();
        onClose();
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0 top-14 z-30 flex flex-col bg-background"
                >
                    <div className="flex items-center justify-between border-b px-4 py-3">
                        <h2 className="text-base font-semibold">Add Expense</h2>
                        <Button
                            aria-label="Close"
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => {
                                resetForm();
                                onClose();
                            }}
                        >
                            <XIcon className="size-4" />
                        </Button>
                    </div>

                    <div className="flex-1 space-y-4 overflow-y-auto p-4">
                        <Field>
                            <FieldLabel>Title</FieldLabel>
                            <FieldContent>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Dinner, Taxi, Hotel..."
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
                                    className="text-lg font-semibold"
                                />
                            </FieldContent>
                            {errors.amount && (
                                <FieldError>{errors.amount}</FieldError>
                            )}
                        </Field>

                        <Field>
                            <FieldLabel>Date</FieldLabel>
                            <Popover>
                                <PopoverTrigger
                                    render={
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start gap-2 font-normal"
                                        />
                                    }
                                >
                                    <CalendarDaysIcon className="size-4 text-muted-foreground" />
                                    {formatDateLabel(date)}
                                </PopoverTrigger>
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
                                    placeholder="Any details..."
                                    rows={2}
                                />
                            </FieldContent>
                        </Field>

                        <Separator />

                        <div className="flex items-center gap-3">
                            <div className="flex-1 space-y-1">
                                <p className="text-xs text-muted-foreground">
                                    Paid by
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-start font-medium"
                                    onClick={() => setShowPaidBy(true)}
                                >
                                    {paidByLabel}
                                </Button>
                            </div>
                            <div className="flex-1 space-y-1">
                                <p className="text-xs text-muted-foreground">
                                    Split
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-start font-medium"
                                    onClick={() => setShowSplit(true)}
                                >
                                    {SPLIT_LABELS[splitType]}
                                </Button>
                            </div>
                        </div>

                        {errors.members && (
                            <FieldError>{errors.members}</FieldError>
                        )}
                        {errors.split && (
                            <FieldError>{errors.split}</FieldError>
                        )}

                        {splitType !== "payer_only" &&
                            totalAmount > 0 &&
                            selected.length > 0 && (
                                <div className="rounded-xl border p-3">
                                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                                        Split preview
                                    </p>
                                    <div className="space-y-1">
                                        {selected.map((m) => {
                                            const share =
                                                splitType === "equal"
                                                    ? totalAmount /
                                                      selected.length
                                                    : splitType === "exact"
                                                      ? Number.parseFloat(
                                                            exactAmounts[
                                                                m.userId
                                                            ] ?? "0"
                                                        ) || 0
                                                      : (totalAmount *
                                                            (Number.parseFloat(
                                                                percentages[
                                                                    m.userId
                                                                ] ?? "0"
                                                            ) || 0)) /
                                                        100;
                                            return (
                                                <div
                                                    key={m.userId}
                                                    className="flex items-center justify-between text-sm"
                                                >
                                                    <span className="text-muted-foreground">
                                                        {m.userId ===
                                                        currentUserId
                                                            ? "You"
                                                            : m.name}
                                                    </span>
                                                    <span className="font-medium tabular-nums">
                                                        ₹{share.toFixed(2)}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                    </div>

                    <div className="border-t p-4">
                        <Button
                            className="w-full"
                            onClick={handleSubmit}
                            disabled={isPending}
                        >
                            {isPending ? (
                                <Loader2Icon className="size-4 animate-spin" />
                            ) : (
                                "Add Expense"
                            )}
                        </Button>
                    </div>

                    {showPaidBy && (
                        <Credenza
                            open={showPaidBy}
                            onOpenChange={setShowPaidBy}
                        >
                            <CredenzaContent className="sm:max-w-sm">
                                <CredenzaHeader>
                                    <CredenzaTitle>Paid by</CredenzaTitle>
                                </CredenzaHeader>
                                <CredenzaBody>
                                    <div className="space-y-1">
                                        {members.map((m) => (
                                            <button
                                                key={m.userId}
                                                onClick={() => {
                                                    setPaidBy(m.userId);
                                                    setShowPaidBy(false);
                                                }}
                                                className={cn(
                                                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted/50",
                                                    paidBy === m.userId &&
                                                        "bg-muted"
                                                )}
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium">
                                                        {m.userId ===
                                                        currentUserId
                                                            ? "You"
                                                            : m.name}
                                                    </p>
                                                    {m.username && (
                                                        <p className="text-xs text-muted-foreground">
                                                            @{m.username}
                                                        </p>
                                                    )}
                                                </div>
                                                {paidBy === m.userId && (
                                                    <CheckIcon className="size-4 text-primary" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </CredenzaBody>
                            </CredenzaContent>
                        </Credenza>
                    )}

                    {showSplit && (
                        <Credenza open={showSplit} onOpenChange={setShowSplit}>
                            <CredenzaContent className="max-h-[80vh] sm:max-w-md">
                                <CredenzaHeader>
                                    <CredenzaTitle>Split options</CredenzaTitle>
                                </CredenzaHeader>
                                <CredenzaBody className="space-y-4 overflow-y-auto">
                                    <Tabs
                                        value={splitType}
                                        onValueChange={(v) =>
                                            setSplitType(v as SplitType)
                                        }
                                    >
                                        <TabsList className="w-full">
                                            {SPLIT_OPTIONS.map((opt) => (
                                                <TabsTrigger
                                                    key={opt.value}
                                                    value={opt.value}
                                                    className="flex-1 text-xs"
                                                >
                                                    {opt.label}
                                                </TabsTrigger>
                                            ))}
                                        </TabsList>

                                        <TabsContent
                                            value="payer_only"
                                            className="mt-3"
                                        >
                                            <p className="py-4 text-center text-sm text-muted-foreground">
                                                Only the payer is responsible
                                                for this expense.
                                            </p>
                                        </TabsContent>

                                        <TabsContent
                                            value="equal"
                                            className="mt-3"
                                        >
                                            <MemberCheckList
                                                members={members}
                                                selectedMembers={
                                                    selectedMembers
                                                }
                                                toggleMember={toggleMember}
                                                currentUserId={currentUserId}
                                                renderExtra={(_, checked) =>
                                                    checked &&
                                                    totalAmount > 0 &&
                                                    selected.length > 0 ? (
                                                        <span className="text-xs text-muted-foreground tabular-nums">
                                                            ₹
                                                            {(
                                                                totalAmount /
                                                                selected.length
                                                            ).toFixed(2)}
                                                        </span>
                                                    ) : null
                                                }
                                            />
                                        </TabsContent>

                                        <TabsContent
                                            value="exact"
                                            className="mt-3"
                                        >
                                            <MemberCheckList
                                                members={members}
                                                selectedMembers={
                                                    selectedMembers
                                                }
                                                toggleMember={toggleMember}
                                                currentUserId={currentUserId}
                                                renderExtra={(m, checked) =>
                                                    checked ? (
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
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    })
                                                                )
                                                            }
                                                        />
                                                    ) : null
                                                }
                                            />
                                        </TabsContent>

                                        <TabsContent
                                            value="percentage"
                                            className="mt-3"
                                        >
                                            <MemberCheckList
                                                members={members}
                                                selectedMembers={
                                                    selectedMembers
                                                }
                                                toggleMember={toggleMember}
                                                currentUserId={currentUserId}
                                                renderExtra={(m, checked) =>
                                                    checked ? (
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
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    })
                                                                )
                                                            }
                                                        />
                                                    ) : null
                                                }
                                            />
                                        </TabsContent>
                                    </Tabs>
                                </CredenzaBody>
                                <CredenzaFooter>
                                    <Button
                                        className="w-full"
                                        onClick={() => setShowSplit(false)}
                                    >
                                        Done
                                    </Button>
                                </CredenzaFooter>
                            </CredenzaContent>
                        </Credenza>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
