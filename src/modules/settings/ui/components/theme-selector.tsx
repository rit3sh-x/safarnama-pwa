import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import type { Theme } from "@/components/theme-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const options: { value: Theme; label: string; icon: typeof SunIcon }[] = [
    { value: "light", label: "Light", icon: SunIcon },
    { value: "dark", label: "Dark", icon: MoonIcon },
    { value: "system", label: "System", icon: MonitorIcon },
];

export function ThemeSelector() {
    const { theme, setTheme } = useTheme();

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">Appearance</h3>
            <div className="flex gap-1 rounded-xl bg-muted p-1">
                {options.map(({ value, label, icon: Icon }) => {
                    const isActive = theme === value;
                    return (
                        <Button
                            key={value}
                            variant={isActive ? "default" : "ghost"}
                            size="sm"
                            className={cn(
                                "flex-1 gap-1.5 transition-colors",
                                !isActive &&
                                    "text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => setTheme(value)}
                        >
                            <Icon className="size-4" />
                            {label}
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}
