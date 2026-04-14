import { createRootRoute, Outlet } from "@tanstack/react-router";
import { useAuthRedirect } from "@/modules/auth/hooks/use-auth-redirect";
import { ErrorView } from "@/modules/dashboard/ui/views/error-view";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export const Route = createRootRoute({
    component: Page,
    errorComponent: ErrorView,
});

function Page() {
    const { isLoading } = useAuthRedirect();

    if (isLoading) {
        return <div className="h-dvh bg-background" />;
    }

    return (
        <div className="h-svh w-svw">
            <Outlet />
            <TanStackRouterDevtools />
        </div>
    );
}
