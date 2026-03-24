import { useEffect } from "react";
import { useAtom, useAtomValue } from "jotai";
import {
    selectedTripAtom,
    tripPanelViewAtom,
    publicTripPreviewAtom,
} from "../../atoms";
import { TripsView } from "./trip-list-view";
import { TripChatView } from "./trip-chat-view";
import { TripInfoView } from "./trip-info-view";
import { PublicTripPreview } from "./public-trip-preview";
import { TripExpenseView } from "@/modules/expense/ui/views/trip-expense-view";
import { TripPlanView } from "./trip-plan-view";
import { MessageSquare } from "lucide-react";
import type { TripPanelView } from "../../types";
import type { Id } from "@backend/dataModel";

export function TripsSplitView() {
    const selectedTrip = useAtomValue(selectedTripAtom);
    const [panelView, setPanelView] = useAtom(tripPanelViewAtom);
    const [publicPreviewId, setPublicPreview] = useAtom(publicTripPreviewAtom);

    useEffect(() => {
        setPanelView("chat");
        if (selectedTrip) setPublicPreview(null);
    }, [selectedTrip, setPanelView, setPublicPreview]);

    return (
        <div className="grid h-full md:grid-cols-[3fr_5fr] lg:grid-cols-[1fr_2fr] xl:grid-cols-[1fr_3fr] 2xl:grid-cols-[1fr_4fr]">
            <div className="relative overflow-hidden border-r border-border">
                <TripsView />
            </div>

            <div className="overflow-hidden">
                {publicPreviewId ? (
                    <PublicTripPreview
                        tripId={publicPreviewId}
                        onBack={() => setPublicPreview(null)}
                    />
                ) : selectedTrip ? (
                    <TripPanel
                        tripId={selectedTrip.tripId}
                        view={panelView}
                        onViewChange={setPanelView}
                    />
                ) : (
                    <EmptyChatPanel />
                )}
            </div>
        </div>
    );
}

function TripPanel({
    tripId,
    view,
    onViewChange,
}: {
    tripId: Id<"trip">;
    view: TripPanelView;
    onViewChange: (view: TripPanelView) => void;
}) {
    switch (view) {
        case "info":
            return (
                <TripInfoView
                    tripId={tripId}
                    onBack={() => onViewChange("chat")}
                />
            );
        case "expenses":
            return (
                <TripExpenseView
                    tripId={tripId}
                    onBack={() => onViewChange("chat")}
                />
            );
        case "plan":
            return (
                <TripPlanView
                    tripId={tripId}
                    onBack={() => onViewChange("chat")}
                />
            );
        case "chat":
            return (
                <TripChatView
                    tripId={tripId}
                    isPanel
                    onGroupPress={() => onViewChange("info")}
                />
            );
    }
}

function EmptyChatPanel() {
    return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-background px-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <MessageSquare className="size-10 text-muted-foreground" />
            </div>
            <div className="text-center">
                <p className="text-xl font-semibold text-foreground">
                    Safarnama
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                    Select a trip from the list to start chatting
                </p>
            </div>
        </div>
    );
}
