import { SignInView } from "@/modules/auth/ui/views/signin-view";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(auth)/signin")({
    component: SignInView,
});
