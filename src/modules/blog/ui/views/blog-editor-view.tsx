import { useState, useCallback } from "react"
import { useRouter } from "@tanstack/react-router"
import { ArrowLeftIcon, Loader2Icon, AlertCircleIcon, XIcon } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { useBlog, useSaveBlog } from "../../hooks/use-blogs"
import { Editor } from "../components/editor"
import { BlogTitleInput } from "../components/blog-title-input"
import { EditorToolbar } from "../components/toolbar/editor-toolbar"
import { FloatingFormatToolbar } from "../components/toolbar/floating-format-toolbar"
import { MobileInsertButton } from "../components/toolbar/mobile-insert-button"
import { useEditorStore } from "../../hooks/use-editor-store"
import { checkProfanity } from "../../lib/profanity"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { Id } from "@backend/dataModel"

interface BlogEditorViewProps {
  blogId: Id<"blog">
}

export function BlogEditorView({ blogId }: BlogEditorViewProps) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const { blog, isLoading } = useBlog(blogId)
  const { mutate: saveBlog, isPending: isSaving } = useSaveBlog()
  const { editor } = useEditorStore()

  const [title, setTitle] = useState(() => blog?.title ?? "")
  const [publishError, setPublishError] = useState<string | null>(null)

  const handleSaveDraft = useCallback(async () => {
    if (!blog || !editor) return
    setPublishError(null)
    await saveBlog({
      tripId: blog.tripId,
      title,
      content: JSON.stringify(editor.getJSON()),
      coverImage: blog.coverImage,
      status: "draft",
    })
  }, [blog, editor, title, saveBlog])

  const handlePublish = useCallback(async () => {
    if (!blog || !editor) return
    setPublishError(null)

    const titleCheck = checkProfanity(title)
    if (titleCheck.hasProfanity) {
      setPublishError("Title contains inappropriate language")
      return
    }
    const textContent = editor.getText()
    const contentCheck = checkProfanity(textContent)
    if (contentCheck.hasProfanity) {
      setPublishError("Content contains inappropriate language")
      return
    }

    try {
      await saveBlog({
        tripId: blog.tripId,
        title,
        content: JSON.stringify(editor.getJSON()),
        coverImage: blog.coverImage,
        status: "published",
      })
    } catch (err) {
      setPublishError(
        err instanceof Error ? err.message : "Failed to publish"
      )
    }
  }, [blog, editor, title, saveBlog])

  if (isLoading) {
    return (
      <div className="flex h-dvh flex-col">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="mx-auto w-full max-w-3xl space-y-4 p-6">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
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
          <span className="text-sm font-medium text-muted-foreground">
            {blog.status === "published" ? "Published" : "Draft"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveDraft}
            disabled={isSaving}
          >
            {isSaving && <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />}
            {isMobile ? "Save" : "Save Draft"}
          </Button>
          <Button size="sm" onClick={handlePublish} disabled={isSaving}>
            Publish
          </Button>
        </div>
      </div>

      {publishError && (
        <div className="flex items-center justify-between gap-2 border-b border-destructive/20 bg-destructive/5 px-4 py-2 text-sm text-destructive">
          <div className="flex items-center gap-2">
            <AlertCircleIcon className="size-4 shrink-0" />
            <span>{publishError}</span>
          </div>
          <button
            aria-label="Dismiss error"
            onClick={() => setPublishError(null)}
            className="shrink-0 rounded-md p-0.5 transition-colors hover:bg-destructive/10"
          >
            <XIcon className="size-3.5" />
          </button>
        </div>
      )}

      {!isMobile && <EditorToolbar />}

      <div className="flex-1 overflow-y-auto">
        <BlogTitleInput value={title} onChange={setTitle} />
        <Editor initialContent={initialContent} editable />
      </div>

      {isMobile && (
        <>
          <FloatingFormatToolbar />
          <MobileInsertButton />
        </>
      )}
    </div>
  )
}
