import { motion } from "framer-motion"
import { useNavigate } from "@tanstack/react-router"
import {
  PlusCircleIcon,
  WalletIcon,
  BookTextIcon,
  SettingsIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const actions = [
  { icon: PlusCircleIcon, label: "New Trip", route: "/trips" },
  { icon: WalletIcon, label: "Expenses", route: "/expenses" },
  { icon: BookTextIcon, label: "Blogs", route: "/blogs" },
  { icon: SettingsIcon, label: "Settings", route: "/settings" },
] as const

export function DashboardQuickActions() {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-3"
    >
      <h2 className="text-base font-semibold">Quick Actions</h2>

      <div className="grid grid-cols-4 gap-2">
        {actions.map(({ icon: Icon, label, route }) => (
          <Button
            key={label}
            variant="outline"
            onClick={() => navigate({ to: route })}
            className="h-auto flex-col gap-1.5 rounded-xl p-3"
          >
            <Icon className="size-5 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">
              {label}
            </span>
          </Button>
        ))}
      </div>
    </motion.div>
  )
}