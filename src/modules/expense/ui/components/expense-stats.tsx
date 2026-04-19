import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsProps {
    totalSpent: number;
    totalOwed: number;
    totalOwing: number;
    expenseCount: number;
    tripCount: number;
    isLoading: boolean;
}

const EASE = [0.16, 1, 0.3, 1] as const;

const fmt = (v: number) => `₹${v.toLocaleString("en-IN")}`;

export function ExpenseStats({
    totalSpent,
    totalOwed,
    totalOwing,
    expenseCount,
    tripCount,
    isLoading,
}: StatsProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-border sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2 bg-background p-4">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-6 w-20" />
                    </div>
                ))}
            </div>
        );
    }

    const tiles = [
        {
            label: "You Paid",
            value: fmt(totalSpent),
            hint:
                expenseCount === 0
                    ? "No expenses"
                    : `${expenseCount} expense${expenseCount === 1 ? "" : "s"}`,
        },
        {
            label: "Owed to You",
            value: fmt(totalOwed),
            hint: totalOwed > 0 ? "Ready to settle" : "All clear",
            accent: "positive" as const,
        },
        {
            label: "You Owe",
            value: fmt(totalOwing),
            hint: totalOwing > 0 ? "Pending settle" : "All clear",
            accent: "negative" as const,
        },
        {
            label: "Trips",
            value: tripCount.toString(),
            hint: tripCount === 1 ? "Active trip" : "Active trips",
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08, ease: EASE }}
            className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-border sm:grid-cols-4"
        >
            {tiles.map((t) => (
                <div
                    key={t.label}
                    className="flex flex-col justify-between gap-3 bg-background p-4"
                >
                    <p className="text-[10px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
                        {t.label}
                    </p>
                    <div className="space-y-1">
                        <p
                            className="text-xl font-semibold tabular-nums"
                            style={{
                                color:
                                    t.accent === "positive"
                                        ? "oklch(0.65 0.17 150)"
                                        : t.accent === "negative"
                                          ? "var(--destructive)"
                                          : undefined,
                            }}
                        >
                            {t.value}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                            {t.hint}
                        </p>
                    </div>
                </div>
            ))}
        </motion.div>
    );
}
