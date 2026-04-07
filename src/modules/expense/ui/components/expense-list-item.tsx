import { useState } from "react";
import {
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
    onDelete,
    onSettle,
}: ExpenseListItemProps) {
    const category = getExpenseCategory(title);
    const Icon = category.icon;

    const [showEdit, setShowEdit] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    return (
        <>
            <div className="flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50">
                <div
                    className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-full bg-muted",
                        category.color
                    )}
                >
                    <Icon className="size-5" />
                </div>

                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                        {title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {paidByName} paid &middot; {formatDate(date)}
                    </p>
                </div>

                <div className="shrink-0 text-right">
                    <span className="text-sm font-semibold text-foreground tabular-nums">
                        ₹{amount.toFixed(2)}
                    </span>
                    {owedAmount !== undefined && owedAmount > 0 && (
                        <p className="text-[10px] text-red-500 tabular-nums">
                            you owe ₹{owedAmount.toFixed(0)}
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
                        {owedAmount !== undefined &&
                            owedAmount > 0 &&
                            onSettle && (
                                <DropdownMenuItem
                                    onClick={() =>
                                        onSettle(
                                            expenseId,
                                            paidBy,
                                            owedAmount,
                                            title
                                        )
                                    }
                                    className="text-emerald-600 focus:text-emerald-600"
                                >
                                    <HandCoinsIcon className="size-4" />
                                    Settle ₹{owedAmount.toFixed(0)}
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
