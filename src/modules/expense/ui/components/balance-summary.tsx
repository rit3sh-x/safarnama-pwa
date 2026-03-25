import { ArrowRightIcon, CheckCircle2, HandCoinsIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export interface BalanceSummaryProps {
    simplified: Array<{ from: string; to: string; amount: number }>;
    userMap: Map<string, { name: string; username: string }>;
    currentUserId: string;
}

function getUserDisplay(
    userId: string,
    currentUserId: string,
    userMap: Map<string, { name: string; username: string }>
) {
    if (userId === currentUserId) return { name: "You", username: "" };
    const info = userMap.get(userId);
    return { name: info?.name ?? "Unknown", username: info?.username ?? "" };
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
        <div className="space-y-1.5 px-4 py-3">
            {simplified.map((txn, i) => {
                const isYouOwe = txn.from === currentUserId;
                const isOwedToYou = txn.to === currentUserId;
                const other = getUserDisplay(
                    isYouOwe ? txn.to : txn.from,
                    currentUserId,
                    userMap
                );

                return (
                    <div
                        key={i}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                    >
                        <div
                            className={cn(
                                "flex size-9 shrink-0 items-center justify-center rounded-full",
                                isYouOwe
                                    ? "bg-red-500/10"
                                    : isOwedToYou
                                      ? "bg-emerald-500/10"
                                      : "bg-muted"
                            )}
                        >
                            <HandCoinsIcon
                                className={cn(
                                    "size-4",
                                    isYouOwe
                                        ? "text-red-500"
                                        : isOwedToYou
                                          ? "text-emerald-600 dark:text-emerald-400"
                                          : "text-muted-foreground"
                                )}
                            />
                        </div>

                        <div className="min-w-0 flex-1">
                            {isYouOwe ? (
                                <>
                                    <p className="truncate text-sm font-medium text-red-500">
                                        You owe {other.name}
                                    </p>
                                    {other.username && (
                                        <p className="text-[10px] text-muted-foreground">
                                            @{other.username}
                                        </p>
                                    )}
                                </>
                            ) : isOwedToYou ? (
                                <>
                                    <p className="truncate text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                        {other.name} owes you
                                    </p>
                                    {other.username && (
                                        <p className="text-[10px] text-muted-foreground">
                                            @{other.username}
                                        </p>
                                    )}
                                </>
                            ) : (
                                <p className="truncate text-sm font-medium">
                                    {
                                        getUserDisplay(
                                            txn.from,
                                            currentUserId,
                                            userMap
                                        ).name
                                    }{" "}
                                    <ArrowRightIcon className="inline size-3 text-muted-foreground" />{" "}
                                    {
                                        getUserDisplay(
                                            txn.to,
                                            currentUserId,
                                            userMap
                                        ).name
                                    }
                                </p>
                            )}
                        </div>

                        <span
                            className={cn(
                                "shrink-0 text-sm font-semibold tabular-nums",
                                isYouOwe
                                    ? "text-red-500"
                                    : isOwedToYou
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : "text-foreground"
                            )}
                        >
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
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
        </div>
    );
}
