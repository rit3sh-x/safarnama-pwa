import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { stringToHex, getInitials } from "@/lib/utils";
import type { Doc, Id } from "@backend/dataModel";

interface PlanHeaderProps {
    trip: Doc<"trip">;
    tripId: Id<"trip">;
    logo?: string;
}

export function PlanHeader({ trip, tripId, logo }: PlanHeaderProps) {
    const navigate = useNavigate();
    const { bg, text } = stringToHex(tripId);

    return (
        <div className="flex shrink-0 items-center gap-3 border-b bg-background px-3 py-2 md:hidden">
            <Button
                variant="ghost"
                size="icon"
                aria-label="Go back"
                className="size-8 shrink-0 rounded-full"
                onClick={() =>
                    navigate({
                        to: "/trips/$tripId/chat",
                        params: { tripId },
                    })
                }
            >
                <ArrowLeft className="size-4" />
            </Button>

            <Avatar className="size-8 shrink-0">
                {logo && <AvatarImage src={logo} alt={trip.title} />}
                <AvatarFallback
                    className="text-xs font-bold"
                    style={{ backgroundColor: bg, color: text }}
                >
                    {getInitials(trip.title)}
                </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{trip.title}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3" />
                    <span className="truncate">{trip.destination}</span>
                </p>
            </div>
        </div>
    );
}
