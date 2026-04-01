import { BellIcon, Loader2Icon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useNotifications } from "../../hooks/use-notifications";

export function NotificationsToggle() {
    const { supported, enabled, isPending, toggle } = useNotifications();

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">
                Notifications
            </h3>
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <BellIcon className="size-4 text-muted-foreground" />
                    <div>
                        <p className="text-sm font-medium">
                            Push Notifications
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {!supported
                                ? "Not supported in this browser"
                                : enabled
                                  ? "You'll receive push notifications"
                                  : "Enable to receive updates"}
                        </p>
                    </div>
                </div>
                {isPending ? (
                    <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
                ) : (
                    <Switch
                        checked={enabled}
                        onCheckedChange={toggle}
                        disabled={!supported || isPending}
                    />
                )}
            </div>
        </div>
    );
}
