import { useNavigate, useRouter } from "@tanstack/react-router"
import { ArrowLeftIcon, CalendarIcon, PencilIcon } from "lucide-react"
import { useBlog } from "../../hooks/use-blogs"
import { Editor } from "../components/editor"
import { BlogRatingSection } from "../components/blog-rating-section"
import { CommentSection } from "../components/comments/comment-section"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import type { Id } from "@backend/dataModel"

interface BlogViewerViewProps {
  blogId: Id<"blog">
}

export function BlogViewerView({ blogId }: BlogViewerViewProps) {
  const router = useRouter()
  const navigate = useNavigate()
  const { blog, isLoading } = useBlog(blogId)

  if (isLoading) {
    return (
      <div className="flex h-dvh flex-col">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="mx-auto w-full max-w-3xl space-y-4 p-6">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    )
  }

  if (!blog) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <p className="text-muted-foreground">Blog not found</p>
      </div>
    )
  }

  const initialContent = blog.content
    ? (() => {
      try {
        return JSON.parse(blog.content)
      } catch {
        return blog.content
      }
    })()
    : undefined

  const publishedDate = blog.publishedAt
    ? format(new Date(blog.publishedAt), "MMMM d, yyyy")
    : null

  return (
    <div className="flex h-dvh flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <Button
            aria-label="Go back"
            variant="ghost"
            size="icon"
            className="size-9"
            onClick={() => router.history.back()}
          >
            <ArrowLeftIcon className="size-4" />
          </Button>
          <span className="text-sm font-medium text-muted-foreground truncate">
            {blog.tripTitle}
          </span>
        </div>
        {blog.isOwner && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() =>
              navigate({
                to: "/blogs/$blogId/edit",
                params: { blogId: blog._id },
              })
            }
          >
            <PencilIcon className="size-3.5" />
            Edit
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {blog.coverImage && (
          <div className="mx-auto w-full max-w-3xl px-4 pt-6 sm:px-6">
            <img
              src={blog.coverImage}
              alt={blog.title}
              loading="lazy"
              className="w-full rounded-xl object-cover"
              style={{ maxHeight: "400px" }}
            />
          </div>
        )}

        <div className="mx-auto w-full max-w-3xl px-4 pt-8 sm:px-6 md:pt-12">
          <h1 className="font-serif text-3xl font-bold leading-tight text-foreground sm:text-4xl md:text-5xl">
            {blog.title}
          </h1>

          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <span>{blog.tripDestination}</span>
            {publishedDate && (
              <span className="flex items-center gap-1">
                <CalendarIcon className="size-3.5" />
                {publishedDate}
              </span>
            )}
          </div>

          <div className="mt-4">
            <BlogRatingSection blogId={blog._id} />
          </div>
        </div>

        <Editor initialContent={initialContent} editable={false} />

        <CommentSection blogId={blog._id} />
      </div>
    </div>
  )
}
