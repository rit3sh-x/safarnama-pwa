import { Badge } from "@/components/ui/badge";
import { useNavigationOptions } from "../../hooks/use-navigation-options";
import type { NavOption } from "../../types";

const OPTIONS: { value: NavOption; label: string; tour: string }[] = [
    { value: "trips", label: "My Trips", tour: "trip-nav-my" },
    { value: "invites", label: "Invites", tour: "trip-nav-invites" },
    { value: "public_trips", label: "Public Trips", tour: "trip-nav-public" },
];

export const NavOptions = () => {
    const { tab, setTab } = useNavigationOptions();

    return (
        <div className="flex flex-row items-center gap-2">
            {OPTIONS.map(({ value, label, tour }) => {
                const isActive = tab === value;

                return (
                    <Badge
                        key={value}
                        data-tour={tour}
                        variant={isActive ? "default" : "outline"}
                        className="cursor-pointer px-3 py-1 shadow-none transition-colors select-none"
                        onClick={() => setTab(value)}
                    >
                        {label}
                    </Badge>
                );
            })}
        </div>
    );
};
