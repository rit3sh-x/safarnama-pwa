import { CheckIcon, XIcon, InboxIcon } from "lucide-react"
import { stringToHex } from "@/lib/utils"
import {
  useAdminListRequests,
  useReviewRequest,
} from "../../../hooks/use-admin-requests"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { InfiniteScrollTrigger } from "@/components/infinite-scroll-trigger"
import type { Id } from "@backend/authDataModel"

interface JoinRequestsSectionProps {
  orgId: Id<"organization">
}

export function JoinRequestsSection({ orgId }: JoinRequestsSectionProps) {
  const { requests, isLoading, isDone, loadMore } = useAdminListRequests({
    orgId,
  })
  const { mutate: reviewRequest, isPending } = useReviewRequest()

  const pendingCount = requests.length

  return (
    <div className="px-4 pb-4">
      <Separator className="mb-4" />

      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-sm font-semibold">Join Requests</h3>
        {pendingCount > 0 && (
          <Badge variant="secondary" className="h-5 min-w-5 justify-center px-1.5 text-xs">
            {pendingCount}
          </Badge>
        )}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && pendingCount === 0 && (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <InboxIcon className="size-8 text-muted-foreground/30" />
          <p className="text-xs text-muted-foreground">No pending requests</p>
        </div>
      )}

      {pendingCount > 0 && (
        <div className="space-y-2">
          {requests.map((req) => {
            const bgColor = stringToHex(req.userId ?? "")

            return (
              <div
                key={req._id}
                className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted/50"
              >
                <Avatar className="size-9" style={{ backgroundColor: bgColor }}>
                  <AvatarFallback className="text-xs text-white">
                    {(req.userName ?? "?").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{req.userName}</p>
                  {req.message && (
                    <p className="truncate text-xs text-muted-foreground">
                      {req.message}
                    </p>
                  )}
                </div>

                <div className="flex gap-1.5">
                  <Button
                    aria-label="Accept request"
                    variant="ghost"
                    size="icon"
                    className="size-9 text-green-600 hover:bg-green-500/10 hover:text-green-600 dark:text-green-400"
                    disabled={isPending}
                    onClick={() =>
                      reviewRequest({
                        requestId: req._id,
                        action: "accept",
                      })
                    }
                  >
                    <CheckIcon className="size-4" />
                  </Button>
                  <Button
                    aria-label="Reject request"
                    variant="ghost"
                    size="icon"
                    className="size-9 text-red-500 hover:bg-red-500/10 hover:text-red-500"
                    disabled={isPending}
                    onClick={() =>
                      reviewRequest({
                        requestId: req._id,
                        action: "reject",
                      })
                    }
                  >
                    <XIcon className="size-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <InfiniteScrollTrigger
        canLoadMore={!isDone}
        isLoadingMore={!isLoading && !isDone && pendingCount > 0}
        onLoadMore={loadMore}
        noMoreText=""
      />
    </div>
  )
}
