import { useMemo, useState } from "react";
import { useDashboardSummary } from "../../hooks/use-dashboard";
import { useTour } from "@/hooks/use-tour";
import { DashboardUpcomingTrips } from "../components/dashboard-upcoming-trips";
import { DashboardRecentActivity } from "../components/dashboard-recent-activity";
import {
    BlogRecommendations,
    PlaceRecommendations,
} from "../components/dashboard-recommendations";
import { CurrencyWidget } from "../components/currency-widget";
import TimezoneWidget from "../components/timezone-widget";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
    Credenza,
    CredenzaContent,
    CredenzaHeader,
    CredenzaTitle,
    CredenzaDescription,
    CredenzaBody,
} from "@/components/ui/credenza";
import { GlobeIcon } from "lucide-react";

export function DashboardView() {
    const { summary, isLoading } = useDashboardSummary();
    const isMobile = useIsMobile();
    const [widgetsOpen, setWidgetsOpen] = useState(false);

    const tourSteps = useMemo(
        () => [
            {
                element: '[data-tour="dash-recs"]',
                popover: {
                    title: "Recommended for you",
                    description:
                        "Blogs and places picked for your travel style.",
                },
            },
            {
                element: '[data-tour="dash-upcoming"]',
                popover: {
                    title: "Upcoming Trips",
                    description:
                        "Active and upcoming trips, sorted by date. Tap to jump in.",
                },
            },
            {
                element: '[data-tour="dash-activity"]',
                popover: {
                    title: "Recent Activity",
                    description:
                        "Latest chat messages across your trips, all in one feed.",
                },
            },
            {
                element: '[data-tour="dash-widgets"]',
                popover: {
                    title: "Currency & Timezone",
                    description:
                        "Live rates and world clocks for the places you're heading.",
                },
            },
        ],
        []
    );
    useTour("dashboard", tourSteps);

    return (
        <div className="flex h-full w-full flex-col overflow-hidden">
            {isMobile && (
                <div className="flex shrink-0 border-b border-border px-4 py-2">
                    <Button
                        data-tour="dash-widgets"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setWidgetsOpen(true)}
                    >
                        <GlobeIcon className="size-3.5" />
                        Currency & Timezone
                    </Button>
                </div>
            )}

            <div className="flex min-h-0 flex-1">
                <div className="min-h-0 flex-1 overflow-y-auto">
                    <div className="space-y-6 p-4 pb-8">
                        <div data-tour="dash-recs" className="space-y-6">
                            <BlogRecommendations />
                            <PlaceRecommendations />
                        </div>

                        <div data-tour="dash-upcoming">
                            <DashboardUpcomingTrips
                                activeTrips={summary?.activeTrips ?? []}
                                upcomingTrips={summary?.upcomingTrips ?? []}
                                isLoading={isLoading}
                            />
                        </div>

                        <div data-tour="dash-activity">
                            <DashboardRecentActivity
                                messages={summary?.recentMessages ?? []}
                                isLoading={isLoading}
                            />
                        </div>
                    </div>
                </div>

                {!isMobile && (
                    <div
                        data-tour="dash-widgets"
                        className="sticky top-0 hidden h-full w-80 shrink-0 self-start overflow-y-auto border-l border-border p-4 md:block lg:w-96"
                    >
                        <div className="space-y-4">
                            <CurrencyWidget />
                            <TimezoneWidget />
                        </div>
                    </div>
                )}
            </div>

            {isMobile && (
                <Credenza open={widgetsOpen} onOpenChange={setWidgetsOpen}>
                    <CredenzaContent>
                        <CredenzaHeader>
                            <CredenzaTitle>Currency & Timezone</CredenzaTitle>
                            <CredenzaDescription>
                                Check exchange rates and compare world clocks at
                                a glance.
                            </CredenzaDescription>
                        </CredenzaHeader>
                        <CredenzaBody className="space-y-4 pb-6">
                            <CurrencyWidget />
                            <TimezoneWidget />
                        </CredenzaBody>
                    </CredenzaContent>
                </Credenza>
            )}
        </div>
    );
}
