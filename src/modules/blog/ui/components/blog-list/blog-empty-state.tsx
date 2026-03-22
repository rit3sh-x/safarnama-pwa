import { BookOpenIcon } from "lucide-react"

interface BlogEmptyStateProps {
  hasSearch: boolean
}

export function BlogEmptyState({ hasSearch }: BlogEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <BookOpenIcon className="size-10 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">
        {hasSearch
          ? "No blogs match your search"
          : "No published blogs yet"}
      </p>
    </div>
  )
}
