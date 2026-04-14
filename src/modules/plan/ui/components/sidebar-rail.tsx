import { ListOrdered, MapPinned, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarRailProps {
    onExpand: (preOpen: "days" | "places") => void;
    className?: string;
}

export function SidebarRail({ onExpand, className }: SidebarRailProps) {
    return (
        <div
            className={cn(
                "flex h-full w-11 flex-col items-center gap-1 border-r bg-background py-2",
                className
            )}
        >
            <Button
                variant="ghost"
                size="icon"
                aria-label="Open sidebar"
                className="size-9"
                onClick={() => onExpand("days")}
            >
                <PanelLeftOpen className="size-4" />
            </Button>
            <div className="my-1 h-px w-6 bg-border" />
            <Button
                variant="ghost"
                size="icon"
                aria-label="Open days"
                className="size-9"
                onClick={() => onExpand("days")}
            >
                <ListOrdered className="size-4" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                aria-label="Open places"
                className="size-9"
                onClick={() => onExpand("places")}
            >
                <MapPinned className="size-4" />
            </Button>
        </div>
    );
}
