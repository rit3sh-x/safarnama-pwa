import type{ FunctionReturnType } from "convex/server";
import type{ api } from "@backend/api";

export type GlobalExpenseSummary = FunctionReturnType<typeof api.methods.expenses.globalSummary>

export type TripExpense = GlobalExpenseSummary["perTrip"][number]