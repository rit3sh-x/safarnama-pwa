import { Outlet } from "@tanstack/react-router";
import { useIsMobile } from "@/hooks/use-mobile";
import { TopBar } from "../components/top-bar";
import { useTabNavigation } from "../../hooks/use-tab-navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/modules/dashboard/ui/components/dashboard-sidebar";

export const DesktopLayout = () => {
    const isMobile = useIsMobile();
    const { currentTab } = useTabNavigation();

    const title = currentTab.title;

    if (!isMobile) {
        return (
            <SidebarProvider
                open={false}
                onOpenChange={() => {}}
                className="h-full"
            >
                <DashboardSidebar />
                <SidebarInset className="overflow-hidden rounded-xl">
                    <TopBar title={title} className="hidden md:flex" />
                    <main className="flex flex-1 flex-col overflow-hidden">
                        <Outlet />
                    </main>
                </SidebarInset>
            </SidebarProvider>
        );
    }

    return <Outlet />;
};
