import { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { stringToHex } from "@/lib/utils";
import type { Doc } from "@backend/dataModel";

interface PlaceAvatarProps {
    place: Doc<"place">;
    size?: number;
}

export function PlaceAvatar({ place, size = 32 }: PlaceAvatarProps) {
    const [imgError, setImgError] = useState(false);
    const showImg = place.imageUrl && !imgError;
    const { bg, text } = stringToHex(place.name);

    const initials = place.name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("");

    return (
        <Avatar style={{ width: size, height: size }} className="shrink-0">
            {showImg && (
                <AvatarImage
                    src={place.imageUrl!}
                    alt={place.name}
                    onError={() => setImgError(true)}
                />
            )}
            <AvatarFallback
                style={{ backgroundColor: bg, color: text }}
                className="text-xs font-bold"
            >
                {initials || "?"}
            </AvatarFallback>
        </Avatar>
    );
}
