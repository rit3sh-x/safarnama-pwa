import { useAtomValue } from "jotai"
import { selectedTripAtom } from "../../atoms"
import { TripsView } from "./trip-list-view"
import { TripChatView } from "./trip-chat-view"
import { MessageSquare } from "lucide-react"

export function TripsSplitView() {
  const selectedTrip = useAtomValue(selectedTripAtom)

  return (
    <div className="grid h-full md:grid-cols-[3fr_5fr] lg:grid-cols-[1fr_2fr] xl:grid-cols-[1fr_3fr] 2xl:grid-cols-[1fr_4fr]">
      <div className="relative overflow-hidden border-r border-border">
        <TripsView />
      </div>

      <div className="overflow-hidden">
        {selectedTrip ? (
          <TripChatView tripId={selectedTrip.tripId} isPanel />
        ) : (
          <EmptyChatPanel />
        )}
      </div>
    </div>
  )
}

function EmptyChatPanel() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-background px-8">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <MessageSquare className="size-10 text-muted-foreground" />
      </div>
      <div className="text-center">
        <p className="text-xl font-semibold text-foreground">Safarnama</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Select a trip from the list to start chatting
        </p>
      </div>
    </div>
  )
}
