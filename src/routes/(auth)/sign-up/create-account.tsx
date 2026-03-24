import { SignUpView } from "@/modules/auth/ui/views/signup-view";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(auth)/sign-up/create-account")({
    component: SignUpView,
});
