import { useState } from "react";
import { BellIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export function NotificationsToggle() {
    const supported = typeof window !== "undefined" && "Notification" in window;

    const [enabled, setEnabled] = useState(
        () => supported && Notification.permission === "granted"
    );

    const handleToggle = async (checked: boolean) => {
        if (!supported) return;

        if (checked) {
            const permission = await Notification.requestPermission();
            setEnabled(permission === "granted");
        } else {
            setEnabled(false);
        }
    };

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
                <Switch
                    checked={enabled}
                    onCheckedChange={handleToggle}
                    disabled={!supported}
                />
            </div>
        </div>
    );
}
