import { useState } from "react";
import { LogOutIcon } from "lucide-react";
import { signOut } from "../../hooks/use-settings-handlers";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
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
import { SettingsFooter } from "../components/settings-footer";

export function SettingsView() {
    const [signOutDialogOpen, setSignOutDialogOpen] = useState(false);

    return (
        <div className="flex h-full flex-col overflow-y-auto">
            <div className="mx-auto w-full max-w-lg space-y-6 p-4">
                <ProfileSection />

                <Separator />

                <ThemeSelector />

                <Separator />

                <NotificationsToggle />

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
