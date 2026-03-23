import { useState } from "react"
import { useAtomValue } from "jotai"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { selectedTripAtom } from "../../atoms"
import { useMembers } from "../../hooks/use-members"
import { TripInfoHeader, MembersSection } from "../components/info"
import { JoinRequestsSection } from "../components/info/join-requests-section"
import { InviteMembersModal } from "../components/invite-members-modal"
import type { Id } from "@backend/dataModel"

interface TripInfoViewProps {
  tripId: Id<"trip">
  onBack?: () => void
}

export function TripInfoView({ tripId, onBack }: TripInfoViewProps) {
  const router = useRouter()
  const selectedTrip = useAtomValue(selectedTripAtom)
  const { members, isLoading, isDone, loadMore } = useMembers(tripId)
  const [showInvite, setShowInvite] = useState(false)

  const isAdmin = selectedTrip?.role === "owner"

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <div className="flex h-14 items-center border-b bg-card px-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-10"
          onClick={onBack ?? (() => router.history.back())}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <span className="text-base font-semibold">Trip Info</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <TripInfoHeader
          name={selectedTrip?.name ?? "Trip"}
          tripId={tripId}
          logo={selectedTrip?.logo}
          memberCount={members.length}
        />

        <MembersSection
          members={members}
          isLoading={isLoading}
          isDone={isDone}
          loadMore={loadMore}
          isAdmin={isAdmin}
          onInvitePress={() => setShowInvite(true)}
        />

        {isAdmin && selectedTrip?.orgId && (
          <JoinRequestsSection orgId={selectedTrip.orgId} />
        )}
      </div>

      {selectedTrip?.orgId && (
        <InviteMembersModal
          open={showInvite}
          onOpenChange={setShowInvite}
          orgId={selectedTrip.orgId}
        />
      )}
    </div>
  )
}
