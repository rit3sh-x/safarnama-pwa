import { motion } from "framer-motion";
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface GlobalBalanceCardProps {
    totalOwed: number;
    totalOwing: number;
    isLoading: boolean;
}

export function GlobalBalanceCard({
    totalOwed,
    totalOwing,
    isLoading,
}: GlobalBalanceCardProps) {
    const netBalance = totalOwed - totalOwing;
    const isPositive = netBalance >= 0;

    if (isLoading) {
        return (
            <Card size="sm" className="p-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-2 h-8 w-32" />
                <div className="mt-3 flex gap-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                </div>
            </Card>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
            <Card size="sm" className="p-4">
                <p className="text-sm text-muted-foreground">Net Balance</p>
                <p
                    className={cn(
                        "mt-1 text-2xl font-bold tabular-nums",
                        isPositive
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-500"
                    )}
                >
                    {isPositive ? "+" : "-"}₹
                    {Math.abs(netBalance).toLocaleString()}
                </p>
                <div className="mt-3 flex gap-6 text-sm">
                    <div className="flex items-center gap-1.5">
                        <TrendingUpIcon className="size-3.5 text-green-600 dark:text-green-400" />
                        <span className="text-muted-foreground">
                            Owed to you
                        </span>
                        <span className="font-medium">
                            ₹{totalOwed.toLocaleString()}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <TrendingDownIcon className="size-3.5 text-red-500" />
                        <span className="text-muted-foreground">You owe</span>
                        <span className="font-medium">
                            ₹{totalOwing.toLocaleString()}
                        </span>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
