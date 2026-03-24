import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InfiniteScrollTrigger } from "@/components/infinite-scroll-trigger";
import { MemberListItem } from "./member-list-item";

interface Member {
    id: string;
    name: string;
    username: string;
    image: string | null;
}

interface MembersSectionProps {
    members: Member[];
    isLoading: boolean;
    isDone: boolean;
    loadMore: () => void;
    isAdmin: boolean;
    onInvitePress: () => void;
}

export function MembersSection({
    members,
    isLoading,
    isDone,
    loadMore,
    isAdmin,
    onInvitePress,
}: MembersSectionProps) {
    return (
        <div className="border-t">
            <div className="flex items-center justify-between px-4 pt-4 pb-1">
                <h2 className="text-sm font-semibold text-muted-foreground">
                    Members
                </h2>
                {isAdmin && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-primary"
                        onClick={onInvitePress}
                    >
                        <UserPlus className="size-4" />
                        Add
                    </Button>
                )}
            </div>

            {isLoading && members.length === 0 && <MembersSkeleton />}

            {members.map((member) => (
                <MemberListItem
                    key={member.id}
                    name={member.name}
                    username={member.username}
                    image={member.image}
                />
            ))}

            {!isDone && (
                <InfiniteScrollTrigger
                    canLoadMore={!isDone}
                    isLoadingMore={isLoading}
                    onLoadMore={loadMore}
                    loadMoreText="Load more members"
                />
            )}
        </div>
    );
}

function MembersSkeleton() {
    return (
        <div className="space-y-3 px-4 py-2">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                    <Skeleton className="size-10 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-28" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                </div>
            ))}
        </div>
    );
}
