import { useState } from "react";
import { useDashboardSummary } from "../../hooks/use-dashboard";
import { DashboardUpcomingTrips } from "../components/dashboard-upcoming-trips";
import { DashboardRecentActivity } from "../components/dashboard-recent-activity";
import { CurrencyWidget } from "../components/currency-widget";
import TimezoneWidget from "../components/timezone-widget";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
    Credenza,
    CredenzaContent,
    CredenzaHeader,
    CredenzaTitle,
    CredenzaBody,
} from "@/components/ui/credenza";
import { GlobeIcon } from "lucide-react";

export function DashboardView() {
    const { summary, isLoading } = useDashboardSummary();
    const isMobile = useIsMobile();
    const [widgetsOpen, setWidgetsOpen] = useState(false);

    return (
        <div className="flex h-full w-full flex-col overflow-hidden">
            {isMobile && (
                <div className="flex shrink-0 border-b border-border px-4 py-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
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
                        <DashboardUpcomingTrips
                            activeTrips={summary?.activeTrips ?? []}
                            upcomingTrips={summary?.upcomingTrips ?? []}
                            isLoading={isLoading}
                        />

                        <DashboardRecentActivity
                            messages={summary?.recentMessages ?? []}
                            isLoading={isLoading}
                        />
                    </div>
                </div>

                {!isMobile && (
                    <div className="sticky top-0 hidden h-full w-80 shrink-0 self-start overflow-y-auto border-l border-border p-4 md:block lg:w-96">
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
