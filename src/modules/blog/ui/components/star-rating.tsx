import { useState } from "react";
import { StarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface StarRatingProps {
    value: number;
    onChange?: (rating: number) => void;
    readOnly?: boolean;
    size?: "sm" | "default";
}

export function StarRating({
    value,
    onChange,
    readOnly = false,
    size = "default",
}: StarRatingProps) {
    const [hovered, setHovered] = useState(0);

    const displayValue = readOnly ? value : hovered || value;
    const iconSize = size === "sm" ? "size-3.5" : "size-5";

    return (
        <div
            className="flex items-center"
            onMouseLeave={() => !readOnly && setHovered(0)}
            aria-label={`Rating: ${value} out of 5`}
        >
            {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= displayValue;

                if (readOnly) {
                    return (
                        <StarIcon
                            key={star}
                            className={cn(
                                iconSize,
                                filled
                                    ? "fill-amber-400 text-amber-400"
                                    : "fill-transparent text-muted-foreground/25"
                            )}
                        />
                    );
                }

                return (
                    <Button
                        key={star}
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
                        onClick={() => onChange?.(star)}
                        onMouseEnter={() => setHovered(star)}
                        className="size-7 transition-transform duration-150 hover:scale-110 hover:bg-transparent active:scale-95"
                    >
                        <StarIcon
                            className={cn(
                                iconSize,
                                "transition-colors duration-150",
                                filled
                                    ? "fill-amber-400 text-amber-400"
                                    : "fill-transparent text-muted-foreground/25"
                            )}
                        />
                    </Button>
                );
            })}
        </div>
    );
}
