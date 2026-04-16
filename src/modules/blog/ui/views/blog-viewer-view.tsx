import { useNavigate, useRouter } from "@tanstack/react-router";
import {
    ArrowLeftIcon,
    CalendarIcon,
    ChevronRightIcon,
    PencilIcon,
} from "lucide-react";
import { useSetAtom } from "jotai";
import { useBlog } from "../../hooks/use-blogs";
import { Editor } from "../components/editor";
import { BlogRatingSection } from "../components/blog-rating-section";
import { CommentSection } from "../components/comments/comment-section";
import { BlogFactsStrip } from "../components/blog-facts-strip";
import { BlogPlacesList } from "../components/blog-places-list";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import { getInitials, stringToHex } from "@/lib/utils";
import { publicTripPreviewAtom } from "@/modules/trips/atoms";
import type { Id } from "@backend/dataModel";

interface BlogViewerViewProps {
    blogId: Id<"blog">;
}

export function BlogViewerView({ blogId }: BlogViewerViewProps) {
    const router = useRouter();
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const setPublicPreview = useSetAtom(publicTripPreviewAtom);
    const { blog, isLoading } = useBlog(blogId);

    const openTrip = () => {
        if (!blog) return;
        setPublicPreview(blog.tripId);
        if (isMobile) {
            navigate({
                to: "/trips/$tripId/info",
                params: { tripId: blog.tripId },
            });
        } else {
            navigate({ to: "/trips" });
        }
    };

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
        );
    }

    if (!blog) {
        return (
            <div className="flex h-dvh items-center justify-center">
                <p className="text-muted-foreground">Blog not found</p>
            </div>
        );
    }

    const initialContent = blog.content
        ? (() => {
              try {
                  return JSON.parse(blog.content);
              } catch {
                  return blog.content;
              }
          })()
        : undefined;

    const publishedDate = blog.publishedAt
        ? format(new Date(blog.publishedAt), "MMMM d, yyyy")
        : null;

    return (
        <div className="flex h-dvh flex-col bg-background">
            <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                    <Button
                        aria-label="Go back"
                        variant="ghost"
                        size="icon"
                        className="size-9 shrink-0"
                        onClick={() => router.history.back()}
                    >
                        <ArrowLeftIcon className="size-4" />
                    </Button>
                    {blog.tripIsPublic ? (
                        <TripGroupPill
                            tripId={blog.tripId}
                            tripTitle={blog.tripTitle}
                            onClick={openTrip}
                        />
                    ) : (
                        <span className="truncate text-sm font-medium text-muted-foreground">
                            {blog.tripTitle}
                        </span>
                    )}
                </div>
                {blog.isOwner && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() =>
                            navigate({
                                to: "/blogs/edit/$tripId",
                                params: { tripId: blog.tripId },
                            })
                        }
                    >
                        <PencilIcon className="size-3.5" />
                        Edit
                    </Button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto">
                {blog.coverImage ? (
                    <div className="mx-auto w-full max-w-3xl px-4 pt-6 sm:px-6">
                        <div className="relative w-full overflow-hidden rounded-xl">
                            <img
                                src={blog.coverImage}
                                alt={blog.title}
                                loading="lazy"
                                className="h-[55vh] max-h-140 min-h-80 w-full object-cover"
                            />
                            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/85 via-black/40 to-transparent" />
                            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 md:p-10">
                                <h1 className="font-serif text-3xl leading-tight font-bold text-white drop-shadow-sm sm:text-4xl md:text-5xl">
                                    {blog.title}
                                </h1>
                                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/85">
                                    <span>{blog.tripDestination}</span>
                                    {publishedDate && (
                                        <span className="flex items-center gap-1">
                                            <CalendarIcon className="size-3.5" />
                                            {publishedDate}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}

                <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
                    {!blog.coverImage && (
                        <div className="pt-8 md:pt-12">
                            <h1 className="font-serif text-3xl leading-tight font-bold text-foreground sm:text-4xl md:text-5xl">
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
                        </div>
                    )}

                    <div className="pt-6">
                        <BlogFactsStrip
                            startDate={blog.startDate}
                            endDate={blog.endDate}
                            budget={blog.budget}
                            currency={blog.currency}
                            tags={blog.tags}
                        />
                    </div>

                    <Editor initialContent={initialContent} editable={false} />

                    <BlogPlacesList places={blog.places} />

                    <BlogRatingSection blogId={blog._id} />

                    <CommentSection blogId={blog._id} />
                </div>
            </div>
        </div>
    );
}

function TripGroupPill({
    tripId,
    tripTitle,
    onClick,
}: {
    tripId: Id<"trip">;
    tripTitle: string;
    onClick: () => void;
}) {
    const { bg, text } = stringToHex(tripId);
    const initials = getInitials(tripTitle) || "T";

    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={`View trip: ${tripTitle}`}
            className="group flex min-w-0 items-center gap-2 rounded-full border border-border bg-muted/30 py-1 pr-2 pl-1 transition-all duration-200 hover:border-primary/40 hover:bg-muted/60 active:scale-[0.97]"
        >
            <span
                className="flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold tracking-wide"
                style={{ backgroundColor: bg, color: text }}
                aria-hidden
            >
                {initials}
            </span>
            <span className="truncate text-xs font-medium text-foreground">
                {tripTitle}
            </span>
            <ChevronRightIcon
                className="size-3 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-foreground"
                aria-hidden
            />
        </button>
    );
}
