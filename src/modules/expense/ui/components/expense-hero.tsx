import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ExpenseHeroProps {
    totalOwed: number;
    totalOwing: number;
    thisMonthSpent: number;
    lastMonthSpent: number;
    isLoading: boolean;
}

const EASE = [0.16, 1, 0.3, 1] as const;

export function ExpenseHero({
    totalOwed,
    totalOwing,
    thisMonthSpent,
    lastMonthSpent,
    isLoading,
}: ExpenseHeroProps) {
    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-20 w-72" />
                <Skeleton className="h-5 w-40" />
            </div>
        );
    }

    const net = totalOwed - totalOwing;
    const isPositive = net >= 0;
    const delta = thisMonthSpent - lastMonthSpent;
    const deltaPct =
        lastMonthSpent > 0 ? Math.round((delta / lastMonthSpent) * 100) : null;
    const deltaUp = delta >= 0;

    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="flex flex-col gap-3"
        >
            <p className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
                Your Ledger
            </p>

            <div className="flex flex-col gap-1">
                <h1
                    className={cn(
                        "font-light tracking-[-0.04em] tabular-nums",
                        "text-[clamp(3rem,10vw,6rem)] leading-[0.95]",
                        isPositive ? "text-foreground" : "text-destructive"
                    )}
                >
                    <span className="text-muted-foreground/50">
                        {isPositive ? "+" : "−"}
                    </span>
                    ₹{Math.abs(net).toLocaleString("en-IN")}
                </h1>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                    <span
                        className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium tabular-nums",
                            deltaUp
                                ? "border-primary/20 bg-primary/5 text-primary"
                                : "border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400"
                        )}
                    >
                        {deltaUp ? (
                            <ArrowUpRight className="size-3" />
                        ) : (
                            <ArrowDownRight className="size-3" />
                        )}
                        ₹{Math.abs(delta).toLocaleString("en-IN")} this month
                        {deltaPct !== null && (
                            <span className="opacity-60">
                                ({deltaUp ? "+" : ""}
                                {deltaPct}%)
                            </span>
                        )}
                    </span>

                    <span className="text-xs text-muted-foreground">
                        {isPositive
                            ? "Net owed to you across all trips"
                            : "Net you owe across all trips"}
                    </span>
                </div>
            </div>
        </motion.section>
    );
}
