import { stringToHex, getInitials, cn } from "@/lib/utils";
import type { Doc } from "@backend/dataModel";

interface PlaceMarkerProps {
    place: Doc<"place">;
    isSelected?: boolean;
    orderNumbers?: number[] | null;
}

export function PlaceMarker({
    place,
    isSelected = false,
    orderNumbers,
}: PlaceMarkerProps) {
    const size = isSelected ? 44 : 36;
    const { bg, text } = stringToHex(place.name);
    const initials = getInitials(place.name) || "?";
    const showBadge = orderNumbers && orderNumbers.length > 0;
    const badgeLabel = showBadge ? orderNumbers.join(" · ") : "";
    const badgeMulti = showBadge && orderNumbers.length > 1;

    return (
        <div
            className={cn(
                "relative flex cursor-pointer items-center justify-center rounded-full transition-[width,height,box-shadow] duration-150",
                isSelected
                    ? "shadow-[0_0_0_3px_rgba(17,24,39,0.25),0_6px_18px_rgba(0,0,0,0.35)] ring-[3px] ring-foreground"
                    : "shadow-[0_2px_8px_rgba(0,0,0,0.22)] ring-[2.5px] ring-white dark:ring-neutral-900"
            )}
            style={{
                width: size,
                height: size,
                background: place.imageUrl ? "transparent" : bg,
            }}
        >
            {place.imageUrl ? (
                <div className="size-full overflow-hidden rounded-full">
                    <img
                        src={place.imageUrl}
                        alt=""
                        className="size-full object-cover"
                        draggable={false}
                    />
                </div>
            ) : (
                <span
                    className="font-sans leading-none font-bold"
                    style={{
                        color: text,
                        fontSize: isSelected ? 13 : 11,
                    }}
                >
                    {initials}
                </span>
            )}
            {showBadge && (
                <span
                    className={cn(
                        "absolute -right-1 -bottom-1 flex items-center justify-center rounded-full border border-black/15 bg-white/95 font-sans leading-none font-extrabold whitespace-nowrap text-neutral-900 shadow",
                        badgeMulti
                            ? "h-4 px-1 text-[7.5px]"
                            : "text-2 h-4 min-w-4 p-1"
                    )}
                >
                    {badgeLabel}
                </span>
            )}
        </div>
    );
}
