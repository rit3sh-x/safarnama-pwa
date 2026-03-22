import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const PRESET_COLORS = [
  "#000000", "#434343", "#666666", "#999999", "#cccccc", "#efefef", "#ffffff",
  "#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#1abc9c", "#3498db", "#9b59b6",
  "#c0392b", "#d35400", "#f39c12", "#27ae60", "#16a085", "#2980b9", "#8e44ad",
]

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  icon: LucideIcon
  label: string
}

export function ColorPicker({
  value,
  onChange,
  icon: Icon,
  label,
}: ColorPickerProps) {
  return (
    <Popover>
      <PopoverTrigger className="flex h-8 min-w-8 flex-col items-center justify-center rounded-md transition-colors hover:bg-muted">
        <Icon className="size-4" />
        <div
          className="h-0.5 w-3.5 rounded-full"
          style={{ backgroundColor: value }}
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto gap-2 p-3" align="start" sideOffset={8}>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className="grid grid-cols-7 gap-1.5">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              aria-label={color}
              onClick={() => onChange(color)}
              className={cn(
                "size-6 rounded-md border border-border transition-transform hover:scale-110",
                value === color && "ring-2 ring-ring ring-offset-1"
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
