import { motion } from "framer-motion";
import { useAuthenticatedUser } from "@/modules/auth/hooks/use-authentication";

export function DashboardGreeting() {
    const { user } = useAuthenticatedUser();

    const hour = new Date().getHours();
    const greeting =
        hour < 12
            ? "Good morning"
            : hour < 18
              ? "Good afternoon"
              : "Good evening";

    const today = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                {greeting}, {user.username}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{today}</p>
        </motion.div>
    );
}
