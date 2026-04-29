import { LogOutIcon } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";

import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { TABS } from "../../constants";

export const DashboardSidebar = () => {
    const pathname = useRouterState({ select: (s) => s.location.pathname });

    const isActive = (url: string) => {
        if (url === "/") return pathname === "/";
        return pathname.startsWith(url);
    };

    return (
        <Sidebar className="group" collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            render={
                                <Link
                                    to="/dashboard"
                                    className="flex items-center justify-center"
                                />
                            }
                        >
                            <img
                                src="/logo.png"
                                alt="Safarnama"
                                className="size-12 shrink-0 object-contain"
                            />
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="mx-auto">
                <SidebarMenu>
                    {TABS.map((tab) => (
                        <SidebarMenuItem key={tab.name}>
                            <SidebarMenuButton
                                isActive={isActive(tab.route)}
                                tooltip={tab.title}
                                className={cn(
                                    isActive(tab.route) &&
                                        "bg-foreground! text-background!"
                                )}
                                render={<Link to={tab.route} />}
                            >
                                <tab.icon className="size-4" />
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>

            <SidebarFooter className="mx-auto">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => authClient.signOut()}>
                            <LogOutIcon className="size-4" />
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
};
