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
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible"

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
} as const

interface ItineraryItemProps {
  time: string
  duration: string
  category: keyof typeof CATEGORY_CONFIG
  title: string
  description: string
  location: string
  pricing: { amount: number; currency: string; note: string }
  weather: string
  tips: string[]
  imageUrl: string
  rating?: number
  bookingUrl?: string
  isLast?: boolean
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
  const [open, setOpen] = useState(false)
  const [imgError, setImgError] = useState(false)
  const config = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.other
  const Icon = config.icon

  const hasDetails =
    (rating !== undefined && rating > 0) ||
    !!weather ||
    !!pricing.note ||
    tips.length > 0 ||
    !!bookingUrl

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
        {!isLast && <div className="w-px flex-1 bg-border" />}
      </div>

      <Collapsible open={open} onOpenChange={setOpen} className="mb-4 flex-1">
        <CollapsibleTrigger
          className={cn(
            "w-full rounded-xl border bg-card p-3 text-left transition-all duration-200",
            "hover:bg-accent/50 active:scale-[0.99]",
            open && "bg-accent/30 ring-1 ring-border"
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h4 className="text-sm leading-tight font-semibold text-foreground">
                {title}
              </h4>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  {time} · {duration}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="size-3" />
                  <span className="truncate">{location}</span>
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              {pricing.amount > 0 && (
                <Badge variant="secondary" className="text-[10px]">
                  {pricing.currency} {pricing.amount}
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

          {imageUrl && !imgError && (
            <div className="mt-2.5 aspect-video overflow-hidden rounded-lg bg-muted">
              <img
                src={imageUrl}
                alt={title}
                className="size-full object-cover"
                loading="lazy"
                onError={() => setImgError(true)}
              />
            </div>
          )}

          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        </CollapsibleTrigger>

        {hasDetails && (
          <CollapsibleContent className="-mt-4 rounded-b-xl border border-t-0 bg-card px-3 pb-3">
            <Separator className="mb-3" />

            <div className="space-y-2.5">
              {rating !== undefined && rating > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Star className="size-3 fill-amber-400 text-amber-400" />
                  <span>{rating.toFixed(1)} rating</span>
                </div>
              )}

              {weather && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CloudSun className="size-3" />
                  <span>{weather}</span>
                </div>
              )}

              {pricing.note && (
                <p className="text-xs text-muted-foreground italic">
                  {pricing.note}
                </p>
              )}

              {tips.length > 0 && (
                <div className="space-y-1">
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
                >
                  Book now <ExternalLink className="size-3" />
                </a>
              )}
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  )
}
