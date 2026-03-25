import { Skeleton } from "@/components/ui/skeleton";
import { getInitials, stringToHex } from "@/lib/utils";
import type { PublicTrip } from "../../../types";
import { InfiniteScrollTrigger } from "@/components/infinite-scroll-trigger";
import { Separator } from "@/components/ui/separator";
import type { Id } from "@backend/dataModel";

function PublicTripItemSkeleton() {
    return (
        <div className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32 rounded-md" />
                    <Skeleton className="h-3 w-10 rounded-md" />
                </div>
                <Skeleton className="h-3 w-24 rounded-md" />
            </div>
        </div>
    );
}

function PublicTripSkeletons() {
    return (
        <>
            {Array.from({ length: 8 }).map((_, i) => (
                <PublicTripItemSkeleton key={i} />
            ))}
        </>
    );
}

interface PublicTripItemProps {
    trip: PublicTrip;
    onPress: (tripId: Id<"trip">) => void;
}

function PublicTripItem({ trip, onPress }: PublicTripItemProps) {
    const initials = getInitials(trip.name);
    const { bg: bgColor, text: textColor } = stringToHex(trip.name);

    return (
        <button
            onClick={() => onPress(trip.tripId)}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left hover:bg-muted/50"
        >
            <div className="h-14 w-14 overflow-hidden rounded-full">
                {trip.logo ? (
                    <img
                        src={trip.logo}
                        alt={trip.name}
                        className="h-full w-full rounded-full object-cover"
                    />
                ) : (
                    <div
                        className="flex h-full w-full items-center justify-center text-lg font-bold"
                        style={{ backgroundColor: bgColor, color: textColor }}
                    >
                        {initials}
                    </div>
                )}
            </div>

            <div className="flex-1 space-y-0.5">
                <p className="truncate text-base font-semibold">{trip.name}</p>
                {trip.destination && (
                    <p className="truncate text-sm text-muted-foreground">
                        {trip.destination}
                    </p>
                )}
            </div>
        </button>
    );
}

interface PublicTripsListProps {
    trips: PublicTrip[];
    isLoading: boolean;
    isDone: boolean;
    loadMore: () => void;
    onPress: (tripId: Id<"trip">) => void;
}

export function PublicTripsList({
    trips,
    isLoading,
    isDone,
    loadMore,
    onPress,
}: PublicTripsListProps) {
    if (isLoading) {
        return (
            <div className="flex-1">
                <PublicTripSkeletons />
            </div>
        );
    }

    if (!isLoading && trips.length === 0) {
        return (
            <div className="flex flex-1 items-center justify-center py-20">
                <p className="text-base text-muted-foreground">
                    No public trips found
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            {trips.map((trip, i) => (
                <div key={trip.tripId}>
                    <PublicTripItem trip={trip} onPress={onPress} />
                    {i !== trips.length - 1 && <Separator />}
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
