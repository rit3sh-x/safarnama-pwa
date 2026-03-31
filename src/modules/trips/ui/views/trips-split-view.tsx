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
import { MessageSquare } from "lucide-react";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
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
        <ResizablePanelGroup
            orientation="horizontal"
            className="h-full w-full min-w-0"
        >
            <ResizablePanel
                defaultSize="32%"
                minSize="25%"
                maxSize="45%"
                collapsible={false}
                className="relative min-w-[320px] overflow-hidden"
            >
                <TripsView />
            </ResizablePanel>

            <ResizableHandle />

            <ResizablePanel
                defaultSize="68%"
                minSize="40%"
                collapsible={false}
                className="min-w-0 overflow-hidden"
            >
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
            </ResizablePanel>
        </ResizablePanelGroup>
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
