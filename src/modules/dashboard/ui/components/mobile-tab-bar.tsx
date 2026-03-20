import { cn } from "@/lib/utils"
import { TABS } from "../../constants"

interface MobileTabBarProps {
  currentIndex: number
  onTabPress: (index: number) => void
}

export function MobileTabBar({ currentIndex, onTabPress }: MobileTabBarProps) {
  return (
    <div className="flex items-center gap-1 border-t border-border bg-background px-4 pt-4 pb-[max(env(safe-area-inset-bottom),16px)]">
      {TABS.map((tab, index) => {
        const isActive = index === currentIndex
        const Icon = tab.icon

        return (
          <button
            key={tab.name}
            type="button"
            onClick={() => onTabPress(index)}
            className={cn(
              "flex h-9 items-center justify-center gap-1 rounded-full transition-all duration-200",
              isActive
                ? "flex-2 bg-primary text-primary-foreground"
                : "flex-1 text-muted-foreground hover:bg-muted"
            )}
          >
            <Icon className="size-5" />
            {isActive && (
              <span className="text-xs font-semibold">{tab.title}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
