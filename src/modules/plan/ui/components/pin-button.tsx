import { MapPinPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PinButtonProps {
    active: boolean;
    onClick: () => void;
    className?: string;
}

export function PinButton({ active, onClick, className }: PinButtonProps) {
    return (
        <Button
            variant={active ? "secondary" : "default"}
            size="icon"
            aria-label={active ? "Cancel pin" : "Drop a pin"}
            className={cn(
                "pointer-events-auto size-11 rounded-full shadow-lg transition-all",
                active &&
                    "ring-2 ring-primary/50 ring-offset-2 ring-offset-background",
                className
            )}
            onClick={onClick}
        >
            <MapPinPlus className="size-5" />
        </Button>
    );
}
