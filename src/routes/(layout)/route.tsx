import { DesktopLayout } from '@/modules/dashboard/ui/layouts/desktop-layout'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(layout)')({
  component: DesktopLayout,
})
