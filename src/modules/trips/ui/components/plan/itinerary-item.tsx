import {
    UtensilsCrossed,
    Compass,
    Car,
    Bed,
    ShoppingBag,
    MoreHorizontal,
    Clock,
    MapPin,
    Star,
    ExternalLink,
    Lightbulb,
    CloudSun,
    ChevronDown,
    ImageOff,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Collapsible,
    CollapsibleTrigger,
    CollapsibleContent,
} from "@/components/ui/collapsible";

const CATEGORY_CONFIG = {
    food: {
        icon: UtensilsCrossed,
        color: "text-orange-500",
        bg: "bg-orange-500/10",
        border: "border-orange-500/20",
        label: "Food",
    },
    activity: {
        icon: Compass,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
        label: "Activity",
    },
    transport: {
        icon: Car,
        color: "text-violet-500",
        bg: "bg-violet-500/10",
        border: "border-violet-500/20",
        label: "Transport",
    },
    accommodation: {
        icon: Bed,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        label: "Stay",
    },
    shopping: {
        icon: ShoppingBag,
        color: "text-pink-500",
        bg: "bg-pink-500/10",
        border: "border-pink-500/20",
        label: "Shopping",
    },
    other: {
        icon: MoreHorizontal,
        color: "text-muted-foreground",
        bg: "bg-muted",
        border: "border-border",
        label: "Other",
    },
} as const;

interface ItineraryItemProps {
    time: string;
    duration: string;
    category: keyof typeof CATEGORY_CONFIG;
    title: string;
    description: string;
    location: string;
    pricing: { amount: number; currency: string; note: string };
    weather: string;
    tips: string[];
    imageUrl: string;
    rating?: number;
    bookingUrl?: string;
    isLast?: boolean;
}

function ItemImage({ src, alt }: { src: string; alt: string }) {
    const [status, setStatus] = useState<"loading" | "loaded" | "error">(
        "loading"
    );

    return (
        <div className="relative mt-2.5 aspect-16/10 overflow-hidden rounded-lg bg-muted">
            {status === "loading" && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="size-5 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground/60" />
                </div>
            )}
            {status === "error" ? (
                <div className="flex size-full items-center justify-center gap-1.5 text-xs text-muted-foreground/50">
                    <ImageOff className="size-4" />
                    <span>Image unavailable</span>
                </div>
            ) : (
                <img
                    src={src}
                    alt={alt}
                    className={cn(
                        "size-full object-cover transition-opacity duration-300",
                        status === "loaded" ? "opacity-100" : "opacity-0"
                    )}
                    loading="lazy"
                    onLoad={() => setStatus("loaded")}
                    onError={() => setStatus("error")}
                />
            )}
        </div>
    );
}

export function ItineraryItem({
    time,
    duration,
    category,
    title,
    description,
    location,
    pricing,
    weather,
    tips,
    imageUrl,
    rating,
    bookingUrl,
    isLast,
}: ItineraryItemProps) {
    const [open, setOpen] = useState(false);
    const config = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.other;
    const Icon = config.icon;
    const hasImage = imageUrl?.trim().length > 0;

    const hasDetails =
        (rating !== undefined && rating > 0) ||
        !!weather ||
        !!pricing.note ||
        tips.length > 0 ||
        !!bookingUrl;

    return (
        <div className="relative flex gap-3 pl-1">
            <div className="flex flex-col items-center pt-1">
                <div
                    className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full border",
                        config.bg,
                        config.border
                    )}
                >
                    <Icon className={cn("size-4", config.color)} />
                </div>
                {!isLast && <div className="w-px flex-1 bg-border/60" />}
            </div>

            <Collapsible
                open={open}
                onOpenChange={setOpen}
                className="mb-4 min-w-0 flex-1"
            >
                <CollapsibleTrigger
                    className={cn(
                        "w-full rounded-xl border bg-card p-3 text-left",
                        "transition-all duration-200 ease-out",
                        "hover:bg-accent/50 active:scale-[0.99]",
                        open && "bg-accent/30 ring-1 ring-border"
                    )}
                >
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <h4 className="truncate text-sm leading-tight font-semibold text-foreground">
                                    {title}
                                </h4>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "shrink-0 border-0 px-1.5 py-0 text-[10px] font-medium",
                                        config.bg,
                                        config.color
                                    )}
                                >
                                    {config.label}
                                </Badge>
                            </div>
                            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Clock className="size-3 shrink-0" />
                                    {time} · {duration}
                                </span>
                                <span className="flex min-w-0 items-center gap-1">
                                    <MapPin className="size-3 shrink-0" />
                                    <span className="truncate">{location}</span>
                                </span>
                            </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                            {pricing.amount > 0 && (
                                <Badge
                                    variant="secondary"
                                    className="text-[10px] font-semibold tabular-nums"
                                >
                                    ₹{pricing.amount.toLocaleString("en-IN")}
                                </Badge>
                            )}
                            {hasDetails && (
                                <ChevronDown
                                    className={cn(
                                        "size-4 text-muted-foreground transition-transform duration-200",
                                        open && "rotate-180"
                                    )}
                                />
                            )}
                        </div>
                    </div>

                    {hasImage && <ItemImage src={imageUrl} alt={title} />}

                    <p
                        className={cn(
                            "line-clamp-2 text-xs leading-relaxed text-muted-foreground",
                            hasImage ? "mt-2" : "mt-1.5"
                        )}
                    >
                        {description}
                    </p>
                </CollapsibleTrigger>

                {hasDetails && (
                    <CollapsibleContent className="-mt-4 rounded-b-xl border border-t-0 bg-card px-3 pb-3">
                        <Separator className="mb-3" />

                        <div className="space-y-2">
                            {((rating !== undefined && rating > 0) ||
                                weather) && (
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                    {rating !== undefined && rating > 0 && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Star className="size-3 fill-amber-400 text-amber-400" />
                                            <span className="font-medium">
                                                {rating.toFixed(1)}
                                            </span>
                                        </div>
                                    )}
                                    {weather && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <CloudSun className="size-3" />
                                            <span>{weather}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {pricing.note && (
                                <p className="text-xs text-muted-foreground/80 italic">
                                    {pricing.note}
                                </p>
                            )}

                            {tips.length > 0 && (
                                <div className="space-y-1 rounded-lg bg-amber-500/5 px-2.5 py-2">
                                    {tips.map((tip, i) => (
                                        <div
                                            key={i}
                                            className="flex items-start gap-1.5 text-xs text-muted-foreground"
                                        >
                                            <Lightbulb className="mt-0.5 size-3 shrink-0 text-amber-500" />
                                            <span>{tip}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {bookingUrl && (
                                <a
                                    href={bookingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    Book now
                                    <ExternalLink className="size-3" />
                                </a>
                            )}
                        </div>
                    </CollapsibleContent>
                )}
            </Collapsible>
        </div>
    );
}
