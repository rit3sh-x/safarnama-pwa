import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSetAtom } from "jotai";
import { selectedTripAtom } from "../../atoms";
import { CreateTripDialog } from "../components/create-trip-dialog";
import { NavOptions } from "../components/nav-options";
import { Navigations } from "../components/navigations";
import { SearchBar } from "../components/search-bar";
import { useTour } from "@/hooks/use-tour";
import type { Id } from "@backend/dataModel";
import type { Doc, Id as IdAuth } from "@backend/authDataModel";

export function TripsView() {
    const [showCreate, setShowCreate] = useState(false);
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const setSelectedTrip = useSetAtom(selectedTripAtom);

    const tourSteps = useMemo(
        () => [
            {
                element: '[data-tour="trip-nav-my"]',
                popover: {
                    title: "My Trips",
                    description: "Trips you own or are a member of.",
                },
            },
            {
                element: '[data-tour="trip-nav-invites"]',
                popover: {
                    title: "Invites",
                    description: "Pending invitations from other travelers.",
                },
            },
            {
                element: '[data-tour="trip-nav-public"]',
                popover: {
                    title: "Public Trips",
                    description:
                        "Discover trips shared publicly by the community.",
                },
            },
            {
                element: '[data-tour="trip-add"]',
                popover: {
                    title: "Create a Trip",
                    description: "Tap here to plan a new trip group.",
                },
            },
        ],
        []
    );
    useTour("trips", tourSteps);

    const handleTripCreated = useCallback(
        ({
            tripId,
            orgId,
            name,
            logo,
            role,
        }: {
            tripId: Id<"trip">;
            orgId: IdAuth<"organization">;
            name: string;
            logo?: string;
            role: Doc<"member">["role"];
        }) => {
            setSelectedTrip({ tripId, orgId, name, logo, role });
            if (isMobile) {
                navigate({
                    to: "/trips/$tripId/chat",
                    params: { tripId },
                });
            }
        },
        [navigate, isMobile, setSelectedTrip]
    );

    return (
        <div className="flex h-full flex-col gap-4 bg-background px-4 pt-2">
            <SearchBar />
            <NavOptions />

            <div className="flex-1 overflow-y-auto">
                <Navigations />
            </div>

            <Button
                data-tour="trip-add"
                onClick={() => setShowCreate(true)}
                className="fixed right-8 bottom-20 h-14 w-14 rounded-full shadow-lg md:absolute md:right-4 md:bottom-4"
            >
                <Plus className="h-6 w-6" />
            </Button>

            {showCreate && (
                <CreateTripDialog
                    open={showCreate}
                    onOpenChange={setShowCreate}
                    onCreated={handleTripCreated}
                />
            )}
        </div>
    );
}
