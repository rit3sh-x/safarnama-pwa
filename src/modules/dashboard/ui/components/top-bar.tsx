import { useNavigate } from "@tanstack/react-router";
import { useAuthentication } from "@/modules/auth/hooks/use-authentication";
import { UserCircle2Icon } from "lucide-react";

import { cn, stringToHex } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface TopBarProps {
    title: string;
    className?: string;
}

export function TopBar({ title, className }: TopBarProps) {
    const navigate = useNavigate();
    const { user } = useAuthentication();

    if (!user || !user.username) {
        return (
            <div
                className={cn(
                    "flex items-center justify-between border-b border-border px-4 pt-4 pb-3",
                    className
                )}
            >
                <Skeleton className="h-6 w-28 rounded-md" />
                <Skeleton className="size-9 rounded-full" />
            </div>
        );
    }

    const avatarBgColor = stringToHex(user.username);

    return (
        <div
            className={cn(
                "flex items-center justify-between border-b border-border px-4 pt-4 pb-3",
                className
            )}
        >
            <h1 className="text-xl font-semibold text-foreground">{title}</h1>

            <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate({ to: "/settings" })}
                className="rounded-full p-0"
                style={{ backgroundColor: avatarBgColor }}
            >
                {user.image ? (
                    <img
                        src={user.image}
                        alt={user.username}
                        className="h-full w-full rounded-full object-cover"
                    />
                ) : (
                    <UserCircle2Icon className="h-7 w-7 text-white/90" />
                )}
            </Button>
        </div>
    );
}
