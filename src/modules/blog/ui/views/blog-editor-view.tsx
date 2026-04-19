import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBlocker, useNavigate, useRouter } from "@tanstack/react-router";
import type { JSONContent } from "@tiptap/react";
import {
    AlertCircleIcon,
    ArrowLeftIcon,
    Loader2Icon,
    XIcon,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTour } from "@/hooks/use-tour";
import { useBlogByTrip, useSaveBlog } from "../../hooks/use-blogs";
import { Editor } from "../components/editor";
import { BlogTitleInput } from "../components/blog-title-input";
import { BlogCoverImageInput } from "../components/blog-cover-image-input";
import {
    BlogMetaPanel,
    type BlogMetaValue,
} from "../components/blog-meta-panel";
import { EditorToolbar } from "../components/toolbar/editor-toolbar";
import { FloatingFormatToolbar } from "../components/toolbar/floating-format-toolbar";
import { MobileInsertButton } from "../components/toolbar/mobile-insert-button";
import { useEditorStore } from "../../hooks/use-editor-store";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Doc, Id } from "@backend/dataModel";

interface BlogEditorViewProps {
    tripId: Id<"trip">;
}

const DRAFT_KEY = (tripId: string) => `safarnama:blog-draft:${tripId}`;
const AUTOSAVE_DELAY = 600;

type LocalDraft = {
    title: string;
    content: string;
    savedAt: number;
};

function readLocalDraft(tripId: string): LocalDraft | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = window.localStorage.getItem(DRAFT_KEY(tripId));
        if (!raw) return null;
        const parsed = JSON.parse(raw) as LocalDraft;
        if (typeof parsed.title !== "string") return null;
        return parsed;
    } catch {
        return null;
    }
}

function writeLocalDraft(tripId: string, draft: LocalDraft) {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(DRAFT_KEY(tripId), JSON.stringify(draft));
    } catch {
        /* quota exceeded — silently ignore */
    }
}

function clearLocalDraft(tripId: string) {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.removeItem(DRAFT_KEY(tripId));
    } catch {
        /* ignore */
    }
}

export function BlogEditorView({ tripId }: BlogEditorViewProps) {
    const { blog, isLoading } = useBlogByTrip(tripId);

    if (isLoading) {
        return (
            <div className="flex h-full min-h-0 flex-col overflow-hidden">
                <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3">
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
        );
    }

    return <BlogEditor key={tripId} tripId={tripId} blog={blog ?? null} />;
}

interface BlogEditorProps {
    tripId: Id<"trip">;
    blog: Doc<"blog"> | null;
}

function BlogEditor({ tripId, blog }: BlogEditorProps) {
    const router = useRouter();
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const { mutate: saveBlog, isPending: isSaving } = useSaveBlog();
    const { editor } = useEditorStore();

    const tourSteps = useMemo(
        () => [
            {
                element: '[data-tour="blog-cover"]',
                popover: {
                    title: "Cover Image",
                    description:
                        "Add a hero image to set the tone. Tap to upload.",
                },
            },
            {
                element: '[data-tour="blog-title"]',
                popover: {
                    title: "Title",
                    description:
                        "Lead with something memorable. First line readers see.",
                },
            },
            {
                element: '[data-tour="blog-toolbar"]',
                popover: {
                    title: "Rich Formatting",
                    description:
                        "Headings, lists, images, tables. Select text for inline toolbar.",
                },
            },
            {
                element: '[data-tour="blog-meta"]',
                popover: {
                    title: "Tags & Meta",
                    description:
                        "Tag your post so travelers can discover it in recommendations.",
                },
            },
            {
                element: '[data-tour="blog-publish"]',
                popover: {
                    title: "Publish",
                    description:
                        "Saves draft automatically. Hit Publish when you're ready to share.",
                },
            },
        ],
        []
    );
    useTour("blog-editor", tourSteps);

    const [{ initialDraft, initialContent }] = useState<{
        initialDraft: LocalDraft | null;
        initialContent: JSONContent | string | undefined;
    }>(() => {
        const local = readLocalDraft(tripId);
        const raw = local?.content ?? blog?.content;
        if (!raw) {
            return { initialDraft: local, initialContent: undefined };
        }
        try {
            return {
                initialDraft: local,
                initialContent: JSON.parse(raw) as JSONContent,
            };
        } catch {
            // Legacy content may be stored as raw HTML — pass through as-is.
            return { initialDraft: local, initialContent: raw };
        }
    });

    const [title, setTitle] = useState(
        () => initialDraft?.title ?? blog?.title ?? ""
    );
    const [coverImage, setCoverImage] = useState<string | undefined>(
        () => blog?.coverImage
    );
    const [meta, setMeta] = useState<BlogMetaValue>(() => ({
        tags: blog?.tags ?? [],
        startDate: blog?.startDate,
        endDate: blog?.endDate,
        budget: blog?.budget,
        currency: blog?.currency ?? "USD",
        placeIds: blog?.placeIds ?? [],
    }));
    const [hasLocalDraft, setHasLocalDraft] = useState(
        () => initialDraft !== null
    );
    const [isDirty, setIsDirty] = useState(false);
    const [publishError, setPublishError] = useState<string | null>(null);
    const [showExitDialog, setShowExitDialog] = useState(false);
    const pendingExit = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (!editor || !isDirty) return;
        const id = window.setTimeout(() => {
            writeLocalDraft(tripId, {
                title,
                content: JSON.stringify(editor.getJSON()),
                savedAt: Date.now(),
            });
        }, AUTOSAVE_DELAY);
        return () => window.clearTimeout(id);
    }, [title, isDirty, editor, tripId]);

    useEffect(() => {
        if (!editor) return;
        const handleUpdate = () => {
            setIsDirty(true);
            setHasLocalDraft(true);
        };
        editor.on("update", handleUpdate);
        return () => {
            editor.off("update", handleUpdate);
        };
    }, [editor]);

    const handleTitleChange = useCallback((next: string) => {
        setTitle(next);
        setIsDirty(true);
        setHasLocalDraft(true);
    }, []);

    const handleCoverImageChange = useCallback((next: string | undefined) => {
        setCoverImage(next);
        setIsDirty(true);
        setHasLocalDraft(true);
    }, []);

    const handleMetaChange = useCallback((patch: Partial<BlogMetaValue>) => {
        setMeta((prev) => ({ ...prev, ...patch }));
        setIsDirty(true);
        setHasLocalDraft(true);
    }, []);

    const handlePublish = useCallback(async () => {
        if (!editor) return;
        const trimmedTitle = title.trim();
        if (!trimmedTitle) {
            setPublishError("Add a title before publishing.");
            return;
        }
        setPublishError(null);
        try {
            const blogId = await saveBlog({
                tripId,
                title: trimmedTitle,
                content: JSON.stringify(editor.getJSON()),
                coverImage,
                tags: meta.tags,
                startDate: meta.startDate,
                endDate: meta.endDate,
                budget: meta.budget,
                currency: meta.currency,
                placeIds: meta.placeIds,
            });
            clearLocalDraft(tripId);
            setIsDirty(false);
            setHasLocalDraft(false);
            const targetId = blogId ?? blog?._id;
            if (targetId) {
                navigate({
                    to: "/blogs/$blogId",
                    params: { blogId: targetId },
                });
            } else {
                router.history.back();
            }
        } catch (err) {
            setPublishError(
                err instanceof Error ? err.message : "Failed to publish"
            );
        }
    }, [
        editor,
        title,
        coverImage,
        meta,
        saveBlog,
        tripId,
        blog,
        navigate,
        router,
    ]);

    useBlocker({
        shouldBlockFn: ({ next }) => {
            if (!isDirty) return false;
            pendingExit.current = () => navigate({ to: next.pathname });
            setShowExitDialog(true);
            return true;
        },
        enableBeforeUnload: () => isDirty,
        withResolver: false,
    });

    const handleBackPress = useCallback(() => {
        if (isDirty) {
            pendingExit.current = () => router.history.back();
            setShowExitDialog(true);
            return;
        }
        router.history.back();
    }, [isDirty, router]);

    const handleSaveDraftNow = useCallback(() => {
        if (!editor) return;
        writeLocalDraft(tripId, {
            title,
            content: JSON.stringify(editor.getJSON()),
            savedAt: Date.now(),
        });
        setIsDirty(false);
        setHasLocalDraft(true);
    }, [editor, tripId, title]);

    const exit = useCallback(() => {
        const fn = pendingExit.current ?? (() => router.history.back());
        pendingExit.current = null;
        fn();
    }, [router]);

    const handleKeepDraft = useCallback(() => {
        if (!editor) return;
        writeLocalDraft(tripId, {
            title,
            content: JSON.stringify(editor.getJSON()),
            savedAt: Date.now(),
        });
        setIsDirty(false);
        setShowExitDialog(false);
        exit();
    }, [editor, tripId, title, exit]);

    const handleDiscardDraft = useCallback(() => {
        clearLocalDraft(tripId);
        setIsDirty(false);
        setHasLocalDraft(false);
        setShowExitDialog(false);
        exit();
    }, [tripId, exit]);

    const statusLabel = useMemo(() => {
        if (isDirty) return "Unsaved changes";
        if (hasLocalDraft) return "Draft saved locally";
        if (blog) return "Published";
        return "New blog";
    }, [isDirty, hasLocalDraft, blog]);

    const statusClass = isDirty
        ? "text-amber-600 dark:text-amber-400"
        : hasLocalDraft
          ? "text-muted-foreground"
          : blog
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-muted-foreground";

    return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
            <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                    <Button
                        aria-label="Go back"
                        variant="ghost"
                        size="icon"
                        className="size-9 shrink-0"
                        onClick={handleBackPress}
                    >
                        <ArrowLeftIcon className="size-4" />
                    </Button>
                    <span
                        className={`truncate text-xs font-medium ${statusClass}`}
                    >
                        {statusLabel}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSaveDraftNow}
                        disabled={!isDirty}
                        title="Save current changes to this device"
                    >
                        {isMobile ? "Save" : "Save draft"}
                    </Button>
                    <Button
                        data-tour="blog-publish"
                        size="sm"
                        onClick={handlePublish}
                        disabled={isSaving}
                    >
                        {isSaving && (
                            <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />
                        )}
                        Publish
                    </Button>
                </div>
            </div>

            {publishError && (
                <div className="flex shrink-0 items-center justify-between gap-2 border-b border-destructive/20 bg-destructive/5 px-4 py-2 text-sm text-destructive">
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

            {!isMobile && (
                <div data-tour="blog-toolbar" className="shrink-0">
                    <EditorToolbar />
                </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
                    <div data-tour="blog-cover">
                        <BlogCoverImageInput
                            value={coverImage}
                            onChange={handleCoverImageChange}
                        />
                    </div>
                    <div data-tour="blog-title">
                        <BlogTitleInput
                            value={title}
                            onChange={handleTitleChange}
                        />
                    </div>
                    <Editor initialContent={initialContent} editable />
                    <div data-tour="blog-meta">
                        <BlogMetaPanel
                            tripId={tripId}
                            value={meta}
                            onChange={handleMetaChange}
                        />
                    </div>
                </div>
            </div>

            {isMobile && (
                <>
                    <FloatingFormatToolbar />
                    <MobileInsertButton />
                </>
            )}

            <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Save your draft?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You have unsaved changes. Keep them as a local draft
                            so you can come back later, or discard and start
                            fresh.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep editing</AlertDialogCancel>
                        <AlertDialogAction
                            variant="outline"
                            onClick={handleDiscardDraft}
                        >
                            Discard
                        </AlertDialogAction>
                        <AlertDialogAction onClick={handleKeepDraft}>
                            Save draft
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
