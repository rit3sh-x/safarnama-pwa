import type { FunctionReturnType } from "convex/server";
import type { api } from "@backend/api";

export type GlobalExpenseSummary = FunctionReturnType<
    typeof api.methods.expense.queries.globalSummary
>;

export type TripExpense = GlobalExpenseSummary["perTrip"][number];
