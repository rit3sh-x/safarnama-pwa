import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ToolbarButtonProps {
  icon: LucideIcon
  label: string
  onClick?: () => void
  isActive?: boolean
  disabled?: boolean
}

export function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  isActive,
  disabled,
}: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        aria-label={label}
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "flex h-8 min-w-8 items-center justify-center rounded-md text-sm transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          isActive && "bg-muted text-foreground"
        )}
      >
        <Icon className="size-4" />
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={6}>
        {label}
      </TooltipContent>
    </Tooltip>
  )
}
