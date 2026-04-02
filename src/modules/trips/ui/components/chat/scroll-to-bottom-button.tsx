import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface ScrollToBottomButtonProps {
    visible: boolean;
    onClick: () => void;
}

export function ScrollToBottomButton({
    visible,
    onClick,
}: ScrollToBottomButtonProps) {
    if (!visible) return null;

    return (
        <div className="pointer-events-none absolute right-4 bottom-24 z-20 flex justify-end md:right-8">
            <Button
                variant="outline"
                size="icon"
                className="pointer-events-auto h-10 w-10 rounded-full bg-card shadow-lg"
                onClick={onClick}
            >
                <ChevronDown className="size-5" />
            </Button>
        </div>
    );
}
