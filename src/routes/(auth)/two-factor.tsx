import { createFileRoute } from "@tanstack/react-router";
import { TwoFactorView } from "@/modules/auth/ui/views/two-factor-view";

export const Route = createFileRoute("/(auth)/two-factor")({
  component: TwoFactorView,
});
