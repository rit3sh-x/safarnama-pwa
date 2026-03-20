import { createRootRoute, Outlet } from "@tanstack/react-router"
import { useAuthRedirect } from "@/modules/auth/hooks/use-auth-redirect"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/modules/dashboard/ui/components/dashboard-sidebar"
import { TopBar } from "@/modules/dashboard/ui/components/top-bar"
import { useTabNavigation } from "@/modules/dashboard/hooks/use-tab-navigation"

export const Route = createRootRoute({
  component: Page,
})

function Page() {
  const { isLoading } = useAuthRedirect()
  const { currentTab } = useTabNavigation()

  const title = currentTab.title

  if (isLoading) {
    return <div className="min-h-screen bg-background" />
  }

  return (
    <SidebarProvider
      open={false}
      onOpenChange={() => {}}
      className="h-screen w-screen"
    >
      <DashboardSidebar />
      <SidebarInset className="overflow-hidden rounded-xl">
        <TopBar title={title} className="hidden md:flex" />
        <main className="flex flex-1 flex-col overflow-hidden">
          <Outlet />
          <TanStackRouterDevtools />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
