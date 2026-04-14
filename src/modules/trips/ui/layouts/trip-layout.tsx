import { Outlet, useRouter } from "@tanstack/react-router";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTripTabNavigation } from "../../hooks/use-trip-tab-navigation";
import { TripTabBar } from "../components/trip-tab-bar";
import { SwipeableOutlet } from "@/components/swipeable-outlet";
import { ChatHeader } from "../components/chat-header";
import { useAtomValue } from "jotai";
import { selectedTripAtom } from "../../atoms";
import type { Id } from "@backend/dataModel";

interface TripLayoutProps {
    tripId: Id<"trip">;
}

export function TripLayout({ tripId }: TripLayoutProps) {
    const isMobile = useIsMobile();
    const router = useRouter();
    const trip = useAtomValue(selectedTripAtom);
    const {
        currentIndex,
        direction,
        navigateToTab,
        navigateNext,
        navigatePrev,
    } = useTripTabNavigation(tripId);

    if (isMobile) {
        return (
            <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
                <div className="shrink-0">
                    <ChatHeader
                        name={trip?.name ?? "Trip"}
                        tripId={tripId}
                        logo={trip?.logo}
                        onBack={() => router.history.back()}
                        onGroupPress={() =>
                            router.navigate({
                                to: "/trips/$tripId/info",
                                params: { tripId },
                            })
                        }
                    />
                </div>
                <SwipeableOutlet
                    currentIndex={currentIndex}
                    direction={direction}
                    onNext={navigateNext}
                    onPrev={navigatePrev}
                />
                <div className="shrink-0">
                    <TripTabBar
                        currentIndex={currentIndex}
                        onTabPress={navigateToTab}
                    />
                </div>
            </div>
        );
    }

    return <Outlet />;
}
