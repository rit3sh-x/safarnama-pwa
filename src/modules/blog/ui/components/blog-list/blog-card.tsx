import { useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { StarIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Id } from "@backend/dataModel";

interface BlogCardProps {
    blogId: Id<"blog">;
    title: string;
    destination: string;
    coverImage?: string;
    publishedAt?: number;
    avgRating?: number;
    totalRatings?: number;
    tags?: string[];
}

export function BlogCard({
    blogId,
    title,
    destination,
    coverImage,
    publishedAt,
    avgRating,
    totalRatings,
    tags,
}: BlogCardProps) {
    const navigate = useNavigate();

    const formattedDate = publishedAt
        ? format(new Date(publishedAt), "MMM d, yyyy")
        : null;

    return (
        <Card
            size="sm"
            role="button"
            tabIndex={0}
            onClick={() =>
                navigate({
                    to: "/blogs/$blogId",
                    params: { blogId },
                })
            }
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                    navigate({
                        to: "/blogs/$blogId",
                        params: { blogId },
                    });
                }
            }}
            className="cursor-pointer overflow-hidden transition-colors hover:bg-muted/50 active:bg-muted"
        >
            <div className="flex gap-4 p-4">
                {coverImage && (
                    <img
                        src={coverImage}
                        alt={title}
                        className="size-16 shrink-0 rounded-lg object-cover sm:size-20"
                    />
                )}

                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <h3 className="truncate font-serif text-base font-semibold text-foreground">
                        {title}
                    </h3>

                    <p className="truncate text-sm text-muted-foreground">
                        {destination}
                    </p>

                    <div className="flex items-center gap-3">
                        {formattedDate && (
                            <p className="text-xs text-muted-foreground/70 tabular-nums">
                                {formattedDate}
                            </p>
                        )}
                        {avgRating != null && avgRating > 0 && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground/70 tabular-nums">
                                <StarIcon className="size-3 fill-yellow-400 text-yellow-400" />
                                {avgRating.toFixed(1)}
                                {totalRatings != null && (
                                    <span>({totalRatings})</span>
                                )}
                            </span>
                        )}
                    </div>

                    {tags && tags.length > 0 && (
                        <div className="flex gap-1 overflow-hidden">
                            {tags.slice(0, 2).map((t) => (
                                <span
                                    key={t}
                                    className="shrink-0 truncate rounded-full bg-foreground/6 px-2 py-px text-[10px] text-muted-foreground"
                                >
                                    #{t}
                                </span>
                            ))}
                            {tags.length > 2 && (
                                <span className="shrink-0 rounded-full bg-foreground/6 px-2 py-px text-[10px] text-muted-foreground">
                                    +{tags.length - 2}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}
