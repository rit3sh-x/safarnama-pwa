import { UsernameView } from "@/modules/auth/ui/views/username-view";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(auth)/sign-up/create-username")({
    component: UsernameView,
});
