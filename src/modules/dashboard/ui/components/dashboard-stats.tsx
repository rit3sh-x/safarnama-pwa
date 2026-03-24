import { motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { MapIcon, WalletIcon, BookTextIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStatsProps {
    totalTrips: number;
    totalSpent: number;
    totalBlogs: number;
    isLoading: boolean;
}

const stats = [
    { key: "trips", icon: MapIcon, label: "Trips", route: "/trips" },
    {
        key: "spent",
        icon: WalletIcon,
        label: "Total Spent",
        route: "/expenses",
    },
    { key: "blogs", icon: BookTextIcon, label: "Blogs", route: "/blogs" },
] as const;

export function DashboardStats({
    totalTrips,
    totalSpent,
    totalBlogs,
    isLoading,
}: DashboardStatsProps) {
    const navigate = useNavigate();

    const values: Record<string, string> = {
        trips: String(totalTrips),
        spent: `₹${totalSpent.toLocaleString()}`,
        blogs: String(totalBlogs),
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-3 gap-3"
        >
            {stats.map(({ key, icon: Icon, label, route }) => (
                <Card
                    key={key}
                    size="sm"
                    className="cursor-pointer p-3 transition-colors hover:bg-muted/50 active:bg-muted"
                    onClick={() => navigate({ to: route })}
                >
                    <div className="flex flex-col gap-2">
                        <Icon className="size-4 text-muted-foreground" />
                        {isLoading ? (
                            <Skeleton className="h-6 w-12" />
                        ) : (
                            <p className="text-lg font-bold text-foreground">
                                {values[key]}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                </Card>
            ))}
        </motion.div>
    );
}
