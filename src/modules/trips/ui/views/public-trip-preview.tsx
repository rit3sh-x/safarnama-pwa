import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "@tanstack/react-router";
import {
    ArrowLeftIcon,
    CalendarIcon,
    GlobeIcon,
    Loader2Icon,
    MapPinIcon,
    SendIcon,
    CheckCircle2Icon,
} from "lucide-react";
import { stringToHex, getInitials } from "@/lib/utils";
import { useTripDetails } from "../../hooks/use-trips";
import { useSendRequest, useRequestStatus } from "../../hooks/use-invites";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
    Credenza,
    CredenzaBody,
    CredenzaContent,
    CredenzaFooter,
    CredenzaHeader,
    CredenzaTitle,
} from "@/components/ui/credenza";
import type { Id } from "@backend/dataModel";

interface PublicTripPreviewProps {
    tripId: Id<"trip">;
    onBack?: () => void;
}

function PreviewSkeleton() {
    return (
        <div className="flex h-full flex-col">
            <div className="flex h-14 items-center gap-2 border-b bg-card px-3">
                <Skeleton className="size-10 rounded-md" />
                <Skeleton className="h-5 w-24" />
            </div>
            <div className="flex flex-1 flex-col items-center gap-5 p-6 pt-12">
                <Skeleton className="size-24 rounded-full" />
                <div className="flex flex-col items-center gap-2">
                    <Skeleton className="h-6 w-44" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="h-px w-full max-w-xs" />
                <div className="w-full max-w-xs space-y-3">
                    <div className="flex items-center gap-3">
                        <Skeleton className="size-4 rounded" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="flex items-center gap-3">
                        <Skeleton className="size-4 rounded" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-12 w-full" />
                </div>
                <Skeleton className="h-px w-full max-w-xs" />
                <Skeleton className="h-10 w-40 rounded-4xl" />
            </div>
        </div>
    );
}

export function PublicTripPreview({ tripId, onBack }: PublicTripPreviewProps) {
    const router = useRouter();
    const { trip, isLoading } = useTripDetails(tripId);
    const { status: requestStatus, isLoading: statusLoading } =
        useRequestStatus(tripId);
    const { mutate: sendRequest, isPending: isSending } = useSendRequest();

    const [showMessageDialog, setShowMessageDialog] = useState(false);
    const [message, setMessage] = useState("");

    const handleJoin = async () => {
        if (!trip) return;
        await sendRequest({
            orgId: trip.orgId,
            message: message.trim() || undefined,
        });
        setShowMessageDialog(false);
        setMessage("");
    };

    if (isLoading || statusLoading) return <PreviewSkeleton />;

    if (!trip) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">Trip not found</p>
            </div>
        );
    }

    const { bg: bgColor, text: textColor } = stringToHex(tripId);
    const isPending = requestStatus === "pending";
    const isAccepted = requestStatus === "accepted";

    const startDate = trip.startDate
        ? new Date(trip.startDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
          })
        : null;
    const endDate = trip.endDate
        ? new Date(trip.endDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
          })
        : null;

    return (
        <div className="flex h-full flex-col bg-background">
            <div className="flex h-14 items-center border-b bg-card px-1">
                <Button
                    aria-label="Go back"
                    variant="ghost"
                    size="icon"
                    className="size-10"
                    onClick={onBack ?? (() => router.history.back())}
                >
                    <ArrowLeftIcon className="size-5" />
                </Button>
                <span className="text-base font-semibold">Public Trip</span>
            </div>

            <div className="flex-1 overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col items-center gap-5 px-6 pt-10 pb-8"
                >
                    <div
                        className="flex size-24 items-center justify-center rounded-full text-2xl font-bold shadow-md"
                        style={{ backgroundColor: bgColor, color: textColor }}
                    >
                        {trip.logo ? (
                            <img
                                src={trip.logo}
                                alt={trip.title}
                                loading="lazy"
                                className="size-full rounded-full object-cover"
                            />
                        ) : (
                            getInitials(trip.title)
                        )}
                    </div>

                    <div className="text-center">
                        <h1 className="text-xl font-bold text-foreground">
                            {trip.title}
                        </h1>
                        <div className="mt-2 flex items-center justify-center gap-2">
                            <Badge variant="secondary" className="gap-1">
                                <GlobeIcon className="size-3" />
                                Public
                            </Badge>
                        </div>
                    </div>

                    <Separator className="w-full max-w-xs" />

                    <div className="w-full max-w-xs space-y-3">
                        {trip.destination && (
                            <div className="flex items-center gap-3 text-sm">
                                <MapPinIcon className="size-4 shrink-0 text-muted-foreground" />
                                <span>{trip.destination}</span>
                            </div>
                        )}
                        {startDate && (
                            <div className="flex items-center gap-3 text-sm">
                                <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
                                <span>
                                    {startDate}
                                    {endDate && ` — ${endDate}`}
                                </span>
                            </div>
                        )}
                        {trip.description && (
                            <p className="text-sm leading-relaxed text-muted-foreground">
                                {trip.description}
                            </p>
                        )}
                    </div>

                    <Separator className="w-full max-w-xs" />

                    <div className="flex flex-col items-center gap-2">
                        {isAccepted ? (
                            <Button disabled className="gap-2">
                                <CheckCircle2Icon className="size-4" />
                                You're a member
                            </Button>
                        ) : isPending ? (
                            <Button
                                disabled
                                variant="outline"
                                className="gap-2"
                            >
                                <CheckCircle2Icon className="size-4" />
                                Request Sent
                            </Button>
                        ) : (
                            <Button
                                onClick={() => setShowMessageDialog(true)}
                                className="gap-2"
                            >
                                <SendIcon className="size-4" />
                                Request to Join
                            </Button>
                        )}

                        {isPending && (
                            <p className="text-xs text-muted-foreground">
                                Waiting for the trip admin to approve
                            </p>
                        )}
                    </div>
                </motion.div>
            </div>

            {showMessageDialog && (
                <Credenza
                    open={showMessageDialog}
                    onOpenChange={setShowMessageDialog}
                >
                    <CredenzaContent className="sm:max-w-md">
                        <CredenzaHeader>
                            <CredenzaTitle>Request to Join</CredenzaTitle>
                        </CredenzaHeader>
                        <CredenzaBody className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                Add an optional message to your request. The
                                trip admin will review it.
                            </p>
                            <textarea
                                aria-label="Message to trip admin"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Hi! I'd love to join this trip..."
                                rows={3}
                                className="w-full resize-none rounded-xl border border-input bg-transparent p-3 text-sm transition-colors outline-none placeholder:text-muted-foreground/50 focus:border-ring"
                            />
                        </CredenzaBody>
                        <CredenzaFooter className="gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowMessageDialog(false);
                                    setMessage("");
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleJoin}
                                disabled={isSending}
                                className="gap-1.5"
                            >
                                {isSending ? (
                                    <Loader2Icon className="size-4 animate-spin" />
                                ) : (
                                    <SendIcon className="size-3.5" />
                                )}
                                Send Request
                            </Button>
                        </CredenzaFooter>
                    </CredenzaContent>
                </Credenza>
            )}
        </div>
    );
}
