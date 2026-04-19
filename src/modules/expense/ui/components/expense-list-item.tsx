import { useState } from "react";
import {
    CheckCircle2Icon,
    HandCoinsIcon,
    MoreVerticalIcon,
    PencilIcon,
    Trash2Icon,
} from "lucide-react";
import { getExpenseCategory } from "../../constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EditExpenseModal } from "./edit-expense-modal";
import type { Id } from "@backend/dataModel";

interface ExpenseListItemProps {
    expenseId: Id<"expense">;
    title: string;
    amount: number;
    paidBy: string;
    paidByName: string;
    date: number;
    notes?: string;
    canEdit?: boolean;
    owedAmount?: number;
    isSettledByMe?: boolean;
    settledAmount?: number;
    onDelete?: (expenseId: Id<"expense">) => void;
    onSettle?: (
        expenseId: Id<"expense">,
        toUserId: string,
        amount: number,
        title: string
    ) => void;
}

function formatDate(timestamp: number) {
    return new Date(timestamp).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
    });
}

export function ExpenseListItem({
    expenseId,
    title,
    amount,
    paidBy,
    paidByName,
    date,
    notes,
    canEdit = false,
    owedAmount,
    isSettledByMe = false,
    settledAmount,
    onDelete,
    onSettle,
}: ExpenseListItemProps) {
    const category = getExpenseCategory(title);
    const Icon = category.icon;

    const [showEdit, setShowEdit] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const showOwed =
        !isSettledByMe && owedAmount !== undefined && owedAmount > 0;
    const canSettle = showOwed && !!onSettle;

    return (
        <>
            <div
                className={cn(
                    "group/row relative flex w-full items-center gap-3 px-4 py-3 transition-colors",
                    isSettledByMe ? "hover:bg-muted/30" : "hover:bg-muted/50"
                )}
            >
                <div
                    className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-full bg-muted transition-opacity",
                        category.color,
                        isSettledByMe && "opacity-60"
                    )}
                >
                    <Icon className="size-5" />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                        <p
                            className={cn(
                                "truncate text-sm font-medium text-foreground",
                                isSettledByMe &&
                                    "text-muted-foreground line-through decoration-muted-foreground/40"
                            )}
                        >
                            {title}
                        </p>
                        {isSettledByMe && (
                            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400">
                                <CheckCircle2Icon className="size-2.5" />
                                Settled
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {paidByName} paid &middot; {formatDate(date)}
                    </p>
                </div>

                <div className="shrink-0 text-right">
                    <span
                        className={cn(
                            "text-sm font-semibold tabular-nums",
                            isSettledByMe
                                ? "text-muted-foreground"
                                : "text-foreground"
                        )}
                    >
                        ₹{amount.toFixed(2)}
                    </span>
                    {showOwed && (
                        <p className="text-[10px] text-red-500 tabular-nums">
                            you owe ₹{owedAmount!.toFixed(0)}
                        </p>
                    )}
                    {isSettledByMe && settledAmount !== undefined && (
                        <p className="text-[10px] text-emerald-600 tabular-nums dark:text-emerald-400">
                            paid ₹{settledAmount.toFixed(0)}
                        </p>
                    )}
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 shrink-0"
                                aria-label="Expense options"
                            />
                        }
                    >
                        <MoreVerticalIcon className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" sideOffset={4}>
                        {canSettle && (
                            <DropdownMenuItem
                                onClick={() =>
                                    onSettle!(
                                        expenseId,
                                        paidBy,
                                        owedAmount!,
                                        title
                                    )
                                }
                                className="text-emerald-600 focus:text-emerald-600"
                            >
                                <HandCoinsIcon className="size-4" />
                                Settle ₹{owedAmount!.toFixed(0)}
                            </DropdownMenuItem>
                        )}
                        {isSettledByMe && (
                            <DropdownMenuItem
                                disabled
                                className="text-emerald-600 focus:text-emerald-600"
                            >
                                <CheckCircle2Icon className="size-4" />
                                Already settled
                            </DropdownMenuItem>
                        )}
                        {canEdit && (
                            <>
                                <DropdownMenuItem
                                    onClick={() => setShowEdit(true)}
                                >
                                    <PencilIcon className="size-4" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <Trash2Icon className="size-4" />
                                    Delete
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {showEdit && (
                <EditExpenseModal
                    open={showEdit}
                    onOpenChange={setShowEdit}
                    expense={{ _id: expenseId, title, amount, date, notes }}
                />
            )}

            <AlertDialog
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete expense?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete "{title}" and all its
                            splits. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => onDelete?.(expenseId)}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
