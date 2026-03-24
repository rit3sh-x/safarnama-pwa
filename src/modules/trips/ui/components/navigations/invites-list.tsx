import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getInitials, stringToHex } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { InviteItem, ReviewType } from "../../../types";
import { InfiniteScrollTrigger } from "@/components/infinite-scroll-trigger";
import { Separator } from "@/components/ui/separator";

function InviteItemSkeleton() {
    return (
        <div className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-3 w-24 rounded-md" />
                <div className="mt-1 flex gap-2">
                    <Skeleton className="h-8 w-20 rounded-md" />
                    <Skeleton className="h-8 w-20 rounded-md" />
                </div>
            </div>
        </div>
    );
}

function InviteSkeletons() {
    return (
        <>
            {Array.from({ length: 6 }).map((_, i) => (
                <InviteItemSkeleton key={i} />
            ))}
        </>
    );
}

interface InviteListItemProps {
    invite: InviteItem;
    onReview: (requestId: InviteItem["_id"], action: ReviewType) => void;
    isReviewing: boolean;
}

function InviteListItem({
    invite,
    onReview,
    isReviewing,
}: InviteListItemProps) {
    const tripName = invite.trip?.title ?? "Unknown Trip";
    const initials = getInitials(tripName);
    const bgColor = stringToHex(tripName);

    const timeLabel = formatDistanceToNow(new Date(invite._creationTime), {
        addSuffix: true,
    });

    return (
        <div className="px-4 py-3">
            <div className="flex items-start gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full">
                    <div
                        className="flex h-full w-full items-center justify-center text-lg font-bold text-white"
                        style={{ backgroundColor: bgColor }}
                    >
                        {initials}
                    </div>
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                        <p className="max-w-[60%] truncate text-base font-semibold sm:max-w-[70%]">
                            {tripName}
                        </p>

                        <p className="shrink-0 text-xs whitespace-nowrap text-muted-foreground">
                            {timeLabel}
                        </p>
                    </div>

                    {invite.message && (
                        <p className="line-clamp-2 text-sm wrap-break-word text-muted-foreground">
                            {invite.message}
                        </p>
                    )}

                    <div className="mt-2 flex gap-2">
                        <Button
                            size="sm"
                            disabled={isReviewing}
                            onClick={() => onReview(invite._id, "accept")}
                            className="rounded-full px-4"
                        >
                            Accept
                        </Button>

                        <Button
                            size="sm"
                            variant="secondary"
                            disabled={isReviewing}
                            onClick={() => onReview(invite._id, "reject")}
                            className="rounded-full px-4"
                        >
                            Decline
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface InvitesListProps {
    invites: InviteItem[];
    isLoading: boolean;
    isDone: boolean;
    loadMore: () => void;
    onReview: (requestId: InviteItem["_id"], action: ReviewType) => void;
    isReviewing: boolean;
}

export function InvitesList({
    invites,
    isLoading,
    isDone,
    loadMore,
    onReview,
    isReviewing,
}: InvitesListProps) {
    if (isLoading) {
        return (
            <div className="flex-1">
                <InviteSkeletons />
            </div>
        );
    }

    if (!isLoading && invites.length === 0) {
        return (
            <div className="flex flex-1 items-center justify-center py-20">
                <p className="text-base text-muted-foreground">
                    No invites found
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            {invites.map((invite, i) => (
                <div key={invite._id}>
                    <InviteListItem
                        invite={invite}
                        onReview={onReview}
                        isReviewing={isReviewing}
                    />
                    {i !== invites.length - 1 && <Separator />}
                </div>
            ))}

            <InfiniteScrollTrigger
                canLoadMore={!isDone}
                isLoadingMore={isLoading}
                onLoadMore={loadMore}
                noMoreText=""
            />
        </div>
    );
}
