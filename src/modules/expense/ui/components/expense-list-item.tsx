import { getExpenseCategory } from "../../constants"
import { cn } from "@/lib/utils"

interface ExpenseListItemProps {
  title: string
  amount: number
  paidByName: string
  date: number
  onClick?: () => void
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  })
}

export function ExpenseListItem({
  title,
  amount,
  paidByName,
  date,
  onClick,
}: ExpenseListItemProps) {
  const category = getExpenseCategory(title)
  const Icon = category.icon

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
    >
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full bg-muted",
          category.color
        )}
      >
        <Icon className="size-5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">
          {paidByName} paid &middot; {formatDate(date)}
        </p>
      </div>

      <span className="shrink-0 text-sm font-semibold text-foreground">
        ₹{amount.toFixed(2)}
      </span>
    </button>
  )
}
