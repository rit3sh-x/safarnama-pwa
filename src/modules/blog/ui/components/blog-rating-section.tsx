import type { RatingValue } from "@backend/types"
import { useRating, useRateBlog } from "../../hooks/use-ratings"
import { StarRating } from "./star-rating"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import type { Id } from "@backend/dataModel"

interface BlogRatingSectionProps {
  blogId: Id<"blog">
}

export function BlogRatingSection({ blogId }: BlogRatingSectionProps) {
  const { avgRating, totalRatings, distribution, userRating, isLoading } =
    useRating(blogId)
  const { mutate: rateBlog } = useRateBlog()

  if (isLoading) {
    return (
      <div className="space-y-3 rounded-xl border border-border p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((s) => (
            <Skeleton key={s} className="h-3 w-full" />
          ))}
        </div>
      </div>
    )
  }

  const maxCount = Math.max(...Object.values(distribution), 1)

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
        <div className="flex flex-col items-center gap-1 sm:min-w-24">
          <span className="text-3xl font-bold tabular-nums text-foreground">
            {avgRating > 0 ? avgRating.toFixed(1) : "---"}
          </span>
          <StarRating value={Math.round(avgRating)} readOnly size="sm" />
          <span className="text-xs text-muted-foreground tabular-nums">
            {totalRatings} {totalRatings === 1 ? "rating" : "ratings"}
          </span>
        </div>

        <div className="flex-1 space-y-1.5">
          {([5, 4, 3, 2, 1] as RatingValue[]).map((star) => {
            const count = distribution[star] ?? 0
            const pct = totalRatings > 0 ? (count / maxCount) * 100 : 0

            return (
              <div key={star} className="flex items-center gap-2">
                <span className="w-4 text-right text-xs tabular-nums text-muted-foreground">
                  {star}
                </span>
                <div className="flex-1">
                  <Progress value={pct} className="h-2" />
                </div>
                <span className="w-6 text-right text-xs tabular-nums text-muted-foreground">
                  {count}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <Separator className="my-3" />

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {userRating ? "You rated this" : "Rate this blog"}
        </span>
        <StarRating
          value={userRating ?? 0}
          onChange={(rating) => rateBlog({ blogId, rating })}
        />
      </div>
    </div>
  )
}
