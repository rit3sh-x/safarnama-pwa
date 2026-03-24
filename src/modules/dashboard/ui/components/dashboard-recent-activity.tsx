import { motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { MessageSquareIcon } from "lucide-react";
import { stringToHex } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { RecentMessage } from "../../types";
import { formatDistanceToNow } from "date-fns";

interface DashboardRecentActivityProps {
    messages: RecentMessage[];
    isLoading: boolean;
}

function relativeTime(timestamp: number): string {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: false });
}

export function DashboardRecentActivity({
    messages,
    isLoading,
}: DashboardRecentActivityProps) {
    const navigate = useNavigate();

    if (isLoading) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 0.5,
                    delay: 0.3,
                    ease: [0.16, 1, 0.3, 1],
                }}
                className="space-y-3"
            >
                <h2 className="text-base font-semibold">Recent Activity</h2>
                {[0, 1, 2].map((i) => (
                    <div key={i} className="flex gap-3">
                        <Skeleton className="size-9 rounded-full" />
                        <div className="flex-1 space-y-1.5">
                            <Skeleton className="h-3.5 w-24" />
                            <Skeleton className="h-3 w-full" />
                        </div>
                    </div>
                ))}
            </motion.div>
        );
    }

    if (messages.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-3"
        >
            <h2 className="text-base font-semibold">Recent Activity</h2>
            <div className="space-y-1">
                {messages.map((msg, i) => {
                    const bgColor = stringToHex(msg.tripId);

                    return (
                        <button
                            key={`${msg.tripId}-${i}`}
                            onClick={() =>
                                navigate({
                                    to: "/trips/$tripId/chat",
                                    params: { tripId: msg.tripId },
                                })
                            }
                            className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-muted/50 active:bg-muted"
                        >
                            <div
                                className="flex size-9 shrink-0 items-center justify-center rounded-full"
                                style={{ backgroundColor: bgColor }}
                            >
                                <MessageSquareIcon className="size-4 text-white/90" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="truncate text-sm font-medium">
                                        {msg.tripTitle}
                                    </span>
                                    <span className="shrink-0 text-xs text-muted-foreground">
                                        {relativeTime(msg.createdAt)}
                                    </span>
                                </div>
                                <p className="truncate text-xs text-muted-foreground">
                                    <span className="font-medium text-foreground/70">
                                        {msg.senderName}:
                                    </span>{" "}
                                    {msg.content}
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </motion.div>
    );
}
