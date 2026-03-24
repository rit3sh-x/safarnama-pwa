import { TripsView } from "@/modules/trips/ui/views/trip-list-view";
import { TripsSplitView } from "@/modules/trips/ui/views/trips-split-view";
import { useIsMobile } from "@/hooks/use-mobile";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(layout)/(home)/trips")({
    component: TripsPage,
});

function TripsPage() {
    const isMobile = useIsMobile();

    return isMobile ? <TripsView /> : <TripsSplitView />;
}
