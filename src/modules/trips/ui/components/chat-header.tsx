import {
    ArrowLeftIcon,
    BookTextIcon,
    SearchIcon,
    UserPlusIcon,
    MoreVerticalIcon,
    InfoIcon,
    WalletIcon,
    MapIcon,
} from "lucide-react";
import { getInitials, stringToHex } from "@/lib/utils";
import type { Id } from "@backend/dataModel";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAtomValue, useSetAtom } from "jotai";
import { selectedTripAtom, tripPanelViewAtom } from "../../atoms";
import { useNavigate } from "@tanstack/react-router";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChatHeaderProps {
    name: string;
    tripId: Id<"trip">;
    logo?: string;
    showBack?: boolean;
    onBack: () => void;
    onGroupPress: () => void;
    onSearchPress?: () => void;
    onInvitePress?: () => void;
}

export function ChatHeader({
    onBack,
    onGroupPress,
    onSearchPress,
    onInvitePress,
    name,
    tripId,
    logo,
    showBack = true,
}: ChatHeaderProps) {
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const initials = getInitials(name);
    const { bg: bgColor, text: textColor } = stringToHex(tripId);
    const panelView = useAtomValue(tripPanelViewAtom);
    const setPanelView = useSetAtom(tripPanelViewAtom);
    const selectedTrip = useAtomValue(selectedTripAtom);
    const isOwner = selectedTrip?.role === "owner";

    const goToInfo = () => {
        if (isMobile) {
            navigate({
                to: "/trips/$tripId/info",
                params: { tripId },
            });
        } else {
            setPanelView("info");
        }
    };

    const goToExpenses = () => {
        if (isMobile) {
            navigate({
                to: "/trips/$tripId/expenses",
                params: { tripId },
            });
        } else {
            setPanelView("expenses");
        }
    };

    const handleWriteBlog = () => {
        navigate({
            to: "/blogs/edit/$tripId",
            params: { tripId },
        });
    };

    return (
        <div className="border-b bg-card">
            <div className="flex h-14 items-center px-1">
                {showBack && (
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Go back"
                        onClick={onBack}
                        className="h-10 w-10"
                    >
                        <ArrowLeftIcon className="h-6 w-6 text-foreground" />
                    </Button>
                )}
                {!showBack && <div className="w-2" />}

                <button
                    onClick={onGroupPress}
                    className="flex flex-1 cursor-pointer items-center gap-3 overflow-hidden rounded-full p-1 pr-2 text-left transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <div className="h-10 w-10 overflow-hidden rounded-full">
                        {logo ? (
                            <img
                                src={logo}
                                alt={name}
                                className="h-full w-full rounded-full object-cover"
                            />
                        ) : (
                            <div
                                className="flex h-full w-full items-center justify-center text-sm font-bold"
                                style={{
                                    backgroundColor: bgColor,
                                    color: textColor,
                                }}
                            >
                                {initials}
                            </div>
                        )}
                    </div>

                    <div className="flex-1">
                        <p className="truncate text-base font-semibold text-foreground">
                            {name}
                        </p>
                    </div>
                </button>

                {(isMobile || panelView !== "expenses") && (
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Expenses"
                        className="size-10 shrink-0"
                        onClick={goToExpenses}
                    >
                        <WalletIcon className="size-5 text-foreground" />
                    </Button>
                )}

                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="More options"
                                className="h-10 w-10"
                            />
                        }
                    >
                        <MoreVerticalIcon className="h-5 w-5 text-foreground" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        sideOffset={4}
                        className="w-64"
                    >
                        <DropdownMenuItem onClick={goToInfo}>
                            <InfoIcon className="size-4" />
                            Trip Info
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() =>
                                navigate({
                                    to: "/plan/$tripId",
                                    params: { tripId },
                                })
                            }
                        >
                            <MapIcon className="size-4" />
                            Plan Trip
                        </DropdownMenuItem>
                        {isOwner && (
                            <DropdownMenuItem onClick={handleWriteBlog}>
                                <BookTextIcon className="size-4" />
                                Write Blog
                            </DropdownMenuItem>
                        )}
                        {onSearchPress && (
                            <DropdownMenuItem onClick={onSearchPress}>
                                <SearchIcon className="size-4" />
                                Search Messages
                                <span className="mt-auto ml-auto text-[10px] text-muted-foreground">
                                    Ctrl+Shift+F
                                </span>
                            </DropdownMenuItem>
                        )}
                        {onInvitePress && (
                            <DropdownMenuItem onClick={onInvitePress}>
                                <UserPlusIcon className="size-4" />
                                Invite Members
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
