import { createFileRoute, redirect } from "@tanstack/react-router"
import { TripLayout } from "@/modules/trips/ui/layouts/trip-layout"
import type { Id } from "@backend/dataModel"
import { getIsMobile } from "@/hooks/use-mobile"
import { z } from "zod"

const tripParamsSchema = z.object({
  tripId: z.string().transform((val) => val as Id<"trip">),
})

export const Route = createFileRoute("/(custom)/trips/$tripId")({
  params: {
    parse: (params) => tripParamsSchema.parse(params),
    stringify: (params) => ({
      tripId: `${params.tripId}`,
    }),
  },
  beforeLoad: () => {
    if (!getIsMobile()) {
      throw redirect({
        to: "/trips",
        replace: true,
      })
    }
  },
  component: Page,
})

function Page() {
  const { tripId } = Route.useParams()
  return <TripLayout tripId={tripId} />
}
