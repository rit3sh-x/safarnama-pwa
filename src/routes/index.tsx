import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuthentication } from "@/modules/auth/hooks/use-authentication";
import { HomeView } from "@/modules/home/ui/views/home-view";

export const Route = createFileRoute("/")({
    component: RootComponent,
});

function RootComponent() {
    const { isAuthenticated, hasUsername } = useAuthentication();

    if (isAuthenticated && hasUsername) {
        return <Navigate to="/dashboard" replace />;
    }

    return <HomeView />;
}
