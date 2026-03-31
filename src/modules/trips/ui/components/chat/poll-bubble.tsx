import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BarChart3Icon, CheckIcon, LockIcon, EyeOffIcon } from "lucide-react";
import type { PollData } from "./types";

interface PollBubbleProps {
    poll: PollData;
    isOwn: boolean;
    isCreator: boolean;
    isAdmin: boolean;
    onVote: (optionIndex: number) => void;
    onClose: () => void;
}

export function PollBubble({
    poll,
    isOwn,
    isCreator,
    isAdmin,
    onVote,
    onClose,
}: PollBubbleProps) {
    const isClosed = !!poll.closedAt;
    const hasVoted = poll.currentUserVotes.length > 0;

    const getVoteCount = (optionIndex: number) => {
        const entry = poll.votes.find((v) => v.optionIndex === optionIndex);
        return entry?.count ?? 0;
    };

    const getPercentage = (optionIndex: number) => {
        if (poll.totalVotes === 0) return 0;
        return Math.round((getVoteCount(optionIndex) / poll.totalVotes) * 100);
    };

    const showResults = hasVoted || isClosed;

    return (
        <div className="my-1 w-full min-w-60">
            <div className="mb-2 flex items-center gap-1.5">
                <BarChart3Icon className="size-3.5 shrink-0 opacity-60" />
                <p className="text-sm leading-snug font-semibold">
                    {poll.question}
                </p>
            </div>

            <div className="space-y-1.5">
                {poll.options.map((option, idx) => {
                    const isSelected = poll.currentUserVotes.includes(idx);
                    const percentage = getPercentage(idx);
                    const count = getVoteCount(idx);

                    return (
                        <button
                            key={idx}
                            onClick={() => !isClosed && onVote(idx)}
                            disabled={isClosed}
                            className={cn(
                                "relative w-full overflow-hidden rounded-lg border px-3 py-2 text-left text-sm transition-all",
                                isClosed
                                    ? "cursor-default"
                                    : "cursor-pointer hover:brightness-95 active:scale-[0.99]",
                                isSelected
                                    ? isOwn
                                        ? "border-primary-foreground/30 bg-primary-foreground/20"
                                        : "border-primary/30 bg-primary/10"
                                    : isOwn
                                      ? "border-primary-foreground/15 bg-primary-foreground/5"
                                      : "border-border bg-background/50"
                            )}
                        >
                            {showResults && (
                                <div
                                    className={cn(
                                        "absolute inset-y-0 left-0 transition-all duration-500",
                                        isSelected
                                            ? isOwn
                                                ? "bg-primary-foreground/15"
                                                : "bg-primary/15"
                                            : isOwn
                                              ? "bg-primary-foreground/5"
                                              : "bg-muted/50"
                                    )}
                                    style={{ width: `${percentage}%` }}
                                />
                            )}
                            <div className="relative flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    {isSelected && (
                                        <CheckIcon className="size-3.5 shrink-0" />
                                    )}
                                    <span
                                        className={cn(
                                            isSelected && "font-medium"
                                        )}
                                    >
                                        {option}
                                    </span>
                                </div>
                                {showResults && (
                                    <span className="shrink-0 text-xs opacity-70">
                                        {percentage}%
                                        {!poll.isAnonymous &&
                                            count > 0 &&
                                            ` (${count})`}
                                    </span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="mt-2 flex items-center justify-between">
                <div
                    className={cn(
                        "flex items-center gap-2 text-xs opacity-60"
                    )}
                >
                    <span>
                        {poll.totalVotes}{" "}
                        {poll.totalVotes === 1 ? "vote" : "votes"}
                    </span>
                    {poll.allowMultiple && (
                        <span className="rounded bg-current/10 px-1">
                            multi
                        </span>
                    )}
                    {poll.isAnonymous && (
                        <span className="flex items-center gap-0.5">
                            <EyeOffIcon className="size-2.5" />
                            anonymous
                        </span>
                    )}
                    {isClosed && (
                        <span className="flex items-center gap-0.5">
                            <LockIcon className="size-2.5" />
                            closed
                        </span>
                    )}
                </div>

                {!isClosed && (isCreator || isAdmin) && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        className={cn(
                            "h-auto px-2 py-0.5 text-xs",
                            isOwn
                                ? "text-primary-foreground/60 hover:text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <LockIcon className="mr-1 size-2.5" />
                        Close poll
                    </Button>
                )}
            </div>
        </div>
    );
}
