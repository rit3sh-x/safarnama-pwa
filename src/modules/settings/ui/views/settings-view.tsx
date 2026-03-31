import { useState } from "react";
import { LogOutIcon } from "lucide-react";
import { signOut } from "../../hooks/use-settings-handlers";
import { useSettings } from "../../hooks/use-settings";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ProfileSection } from "../components/profile-section";
import { ThemeSelector } from "../components/theme-selector";
import { NotificationsToggle } from "../components/notifications-toggle";
import { TwoFactorToggle } from "../components/two-factor-toggle";
import { SettingsFooter } from "../components/settings-footer";

export function SettingsView() {
    const [signOutDialogOpen, setSignOutDialogOpen] = useState(false);
    const {
        temperatureUnit,
        setTemperatureUnit,
        timeFormat,
        setTimeFormat,
        showPlaceDescription,
        setShowPlaceDescription,
        defaultZoom,
        setDefaultZoom,
    } = useSettings();

    return (
        <div className="flex h-full flex-col overflow-y-auto">
            <div className="mx-auto w-full max-w-lg space-y-6 p-4">
                <ProfileSection />

                <Separator />

                <ThemeSelector />

                <Separator />

                <div className="space-y-4">
                    <h3 className="text-sm font-semibold">Preferences</h3>

                    <div className="flex items-center justify-between">
                        <Label htmlFor="temp-unit" className="cursor-pointer">
                            Temperature unit
                        </Label>
                        <Select
                            value={temperatureUnit}
                            onValueChange={(v) =>
                                v &&
                                setTemperatureUnit(
                                    v as "celsius" | "fahrenheit"
                                )
                            }
                        >
                            <SelectTrigger
                                id="temp-unit"
                                className="h-9 w-36 text-xs transition-colors"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="celsius">
                                    Celsius (&deg;C)
                                </SelectItem>
                                <SelectItem value="fahrenheit">
                                    Fahrenheit (&deg;F)
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center justify-between">
                        <Label htmlFor="time-format" className="cursor-pointer">
                            Time format
                        </Label>
                        <Select
                            value={timeFormat}
                            onValueChange={(v) =>
                                v && setTimeFormat(v as "12h" | "24h")
                            }
                        >
                            <SelectTrigger
                                id="time-format"
                                className="h-9 w-36 text-xs transition-colors"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="12h">12-hour</SelectItem>
                                <SelectItem value="24h">24-hour</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center justify-between">
                        <Label
                            htmlFor="show-place-desc"
                            className="cursor-pointer"
                        >
                            Show place descriptions
                        </Label>
                        <Switch
                            id="show-place-desc"
                            checked={showPlaceDescription}
                            onCheckedChange={setShowPlaceDescription}
                            className="transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="default-zoom">
                                Default map zoom
                            </Label>
                            <span className="text-xs text-muted-foreground tabular-nums">
                                {defaultZoom}
                            </span>
                        </div>
                        <Slider
                            id="default-zoom"
                            min={1}
                            max={20}
                            value={[defaultZoom]}
                            onValueChange={(v) =>
                                setDefaultZoom(Array.isArray(v) ? v[0] : v)
                            }
                            className="transition-colors"
                        />
                    </div>
                </div>

                <Separator />

                <NotificationsToggle />

                <Separator />

                <TwoFactorToggle />

                <Separator />

                <Button
                    variant="outline"
                    className="w-full gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setSignOutDialogOpen(true)}
                >
                    <LogOutIcon className="size-4" />
                    Sign Out
                </Button>

                <SettingsFooter />
            </div>

            <AlertDialog
                open={signOutDialogOpen}
                onOpenChange={setSignOutDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Sign out?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to sign out of your account?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => signOut({})}>
                            Sign Out
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
