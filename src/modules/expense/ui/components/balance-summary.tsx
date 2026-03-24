import { ArrowRightIcon, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface BalanceSummaryProps {
    simplified: Array<{ from: string; to: string; amount: number }>;
    userMap: Map<string, string>;
    currentUserId: string;
}

export function BalanceSummary({
    simplified,
    userMap,
    currentUserId,
}: BalanceSummaryProps) {
    if (simplified.length === 0) {
        return (
            <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
                <CheckCircle2 className="size-8 text-emerald-500" />
                <p className="text-sm font-medium text-muted-foreground">
                    All settled up!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-2 px-4 py-3">
            {simplified.map((txn, i) => {
                const fromName =
                    txn.from === currentUserId
                        ? "You"
                        : (userMap.get(txn.from) ?? "Unknown");
                const toName =
                    txn.to === currentUserId
                        ? "You"
                        : (userMap.get(txn.to) ?? "Unknown");
                const isYouOwe = txn.from === currentUserId;
                const isOwedToYou = txn.to === currentUserId;

                return (
                    <div
                        key={i}
                        className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2"
                    >
                        <span
                            className={cn(
                                "text-sm font-medium",
                                isYouOwe ? "text-red-500" : "text-foreground"
                            )}
                        >
                            {fromName}
                        </span>
                        <ArrowRightIcon className="size-3.5 shrink-0 text-muted-foreground" />
                        <span
                            className={cn(
                                "text-sm font-medium",
                                isOwedToYou
                                    ? "text-emerald-500"
                                    : "text-foreground"
                            )}
                        >
                            {toName}
                        </span>
                        <span className="ml-auto text-sm font-semibold">
                            ₹{txn.amount.toFixed(2)}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

export function BalanceSummarySkeleton() {
    return (
        <div className="space-y-2 px-4 py-3">
            {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
        </div>
    );
}
