import { Calendar } from "lucide-react"
import { format, parseISO, isValid } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { ItineraryItem } from "./itinerary-item"
import type { DayItem } from "@/modules/trips/types"

interface DayCardProps {
  day: number
  date: string
  dayTheme?: string
  items: DayItem[]
}

function formatDayDate(dateStr: string) {
  const parsed = parseISO(dateStr)
  if (!isValid(parsed)) return ""
  return format(parsed, "EEE, d MMM")
}

export function DayCard({ day, date, dayTheme, items }: DayCardProps) {
  return (
    <section className="border-b border-border last:border-b-0">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border/50 bg-background/95 px-4 py-3 backdrop-blur-sm">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {day}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Calendar className="size-3.5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              {formatDayDate(date)}
            </span>
            <Badge variant="secondary" className="text-[10px]">
              {items.length} {items.length === 1 ? "stop" : "stops"}
            </Badge>
          </div>

          {dayTheme && (
            <p className="truncate text-xs text-muted-foreground">{dayTheme}</p>
          )}
        </div>
      </div>

      <div className="px-4 pt-3">
        {items.map((item, i) => (
          <ItineraryItem key={i} {...item} isLast={i === items.length - 1} />
        ))}
      </div>
    </section>
  )
}
