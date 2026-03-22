import { createFileRoute } from "@tanstack/react-router"
import { ExpensesView } from "@/modules/expense/ui/views/expenses-view"

export const Route = createFileRoute("/(home)/expenses")({
  component: ExpensesView,
})
