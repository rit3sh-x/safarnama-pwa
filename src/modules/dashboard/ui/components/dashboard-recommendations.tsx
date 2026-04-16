import { useCallback, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MapPinIcon, StarIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { stringToHex, getInitials, cn } from "@/lib/utils";
import {
    useRecommendedBlogs,
    useRecommendedPlaces,
} from "../../hooks/use-dashboard";
import type { Id } from "@backend/dataModel";

function ScrollFade({ children }: { children: React.ReactNode }) {
    const [showLeft, setShowLeft] = useState(false);
    const [showRight, setShowRight] = useState(true);
    const ref = useRef<HTMLDivElement>(null);

    const updateFade = useCallback(() => {
        const el = ref.current;
        if (!el) return;
        setShowLeft(el.scrollLeft > 8);
        setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
    }, []);

    return (
        <div className="relative -mx-4">
            <div
                className={cn(
                    "pointer-events-none absolute inset-y-0 left-0 z-10 w-8 transition-opacity duration-200",
                    showLeft ? "opacity-100" : "opacity-0"
                )}
                style={{
                    background:
                        "linear-gradient(to right, var(--background), transparent)",
                }}
            />
            <div
                className={cn(
                    "pointer-events-none absolute inset-y-0 right-0 z-10 w-8 transition-opacity duration-200",
                    showRight ? "opacity-100" : "opacity-0"
                )}
                style={{
                    background:
                        "linear-gradient(to left, var(--background), transparent)",
                }}
            />
            <div
                ref={ref}
                onScroll={updateFade}
                className="scrollbar-hidden flex gap-3 overflow-x-auto px-4 pb-2"
            >
                {children}
            </div>
        </div>
    );
}

export function BlogRecommendations() {
    const { blogs, isLoading } = useRecommendedBlogs();

    return (
        <section>
            <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-base font-semibold">Recommended blogs</h2>
                <Link
                    to="/blogs"
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                    View all
                </Link>
            </div>

            <ScrollFade>
                {isLoading
                    ? Array.from({ length: 5 }).map((_, i) => (
                          <Skeleton
                              key={i}
                              className="h-44 w-48 shrink-0 rounded-xl"
                          />
                      ))
                    : blogs.map((blog) => (
                          <BlogCard
                              key={blog._id}
                              blogId={blog._id as Id<"blog">}
                              title={blog.title}
                              coverImage={blog.coverImage}
                              destination={blog.tripDestination}
                              avgRating={blog.avgRating}
                              totalRatings={blog.totalRatings}
                              tags={blog.tags}
                          />
                      ))}
                {!isLoading && blogs.length === 0 && (
                    <p className="py-6 text-sm text-muted-foreground">
                        No blogs yet.
                    </p>
                )}
            </ScrollFade>
        </section>
    );
}

function BlogCard({
    blogId,
    title,
    coverImage,
    destination,
    avgRating,
    totalRatings,
    tags,
}: {
    blogId: Id<"blog">;
    title: string;
    coverImage?: string;
    destination: string;
    avgRating: number;
    totalRatings: number;
    tags?: string[];
}) {
    const { bg, text } = stringToHex(blogId);
    const initials = getInitials(title) || "B";

    return (
        <Link
            to="/blogs/$blogId"
            params={{ blogId }}
            className="group relative flex h-44 w-48 shrink-0 flex-col justify-end overflow-hidden rounded-xl border border-border bg-muted/20 transition-shadow hover:shadow-md"
        >
            {coverImage ? (
                <img
                    src={coverImage}
                    alt={title}
                    loading="lazy"
                    className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
            ) : (
                <div
                    className="absolute inset-0 flex items-center justify-center text-2xl font-bold"
                    style={{ backgroundColor: bg, color: text }}
                >
                    {initials}
                </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />
            <div className="relative z-10 p-3">
                <p className="line-clamp-2 text-sm leading-tight font-medium text-white">
                    {title}
                </p>
                <div className="mt-1.5 flex items-center gap-2 text-[10px] text-white/75">
                    <span className="truncate">{destination}</span>
                    {totalRatings > 0 && (
                        <span className="flex shrink-0 items-center gap-0.5">
                            <StarIcon className="size-2.5 fill-amber-400 text-amber-400" />
                            {avgRating}
                        </span>
                    )}
                </div>
                {tags && tags.length > 0 && (
                    <div className="mt-1 flex gap-1 overflow-hidden">
                        {tags.slice(0, 2).map((t) => (
                            <span
                                key={t}
                                className="max-w-16 shrink-0 truncate rounded-full bg-white/15 px-1.5 py-px text-[9px] text-white/80"
                            >
                                #{t}
                            </span>
                        ))}
                        {tags.length > 2 && (
                            <span className="shrink-0 rounded-full bg-white/15 px-1.5 py-px text-[9px] text-white/80">
                                +{tags.length - 2}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </Link>
    );
}

export function PlaceRecommendations() {
    const { places, isLoading } = useRecommendedPlaces();

    return (
        <section>
            <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-base font-semibold">Places to explore</h2>
            </div>

            <ScrollFade>
                {isLoading
                    ? Array.from({ length: 5 }).map((_, i) => (
                          <Skeleton
                              key={i}
                              className="h-32 w-40 shrink-0 rounded-xl"
                          />
                      ))
                    : places.map((place) => (
                          <PlaceCard
                              key={place._id}
                              placeId={place._id as Id<"place">}
                              name={place.name}
                              imageUrl={place.imageUrl}
                              destination={place.tripDestination}
                          />
                      ))}
                {!isLoading && places.length === 0 && (
                    <p className="py-6 text-sm text-muted-foreground">
                        No places yet.
                    </p>
                )}
            </ScrollFade>
        </section>
    );
}

function PlaceCard({
    placeId,
    name,
    imageUrl,
    destination,
}: {
    placeId: Id<"place">;
    name: string;
    imageUrl?: string;
    destination: string;
}) {
    const { bg, text } = stringToHex(placeId);
    const initials = getInitials(name) || "?";

    return (
        <Link
            to="/place/$placeId"
            params={{ placeId }}
            className="group relative flex h-32 w-40 shrink-0 flex-col justify-end overflow-hidden rounded-xl border border-border bg-muted/20 transition-shadow hover:shadow-md"
        >
            {imageUrl ? (
                <img
                    src={imageUrl}
                    alt={name}
                    loading="lazy"
                    className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
            ) : (
                <div
                    className="absolute inset-0 flex items-center justify-center text-xl font-bold"
                    style={{ backgroundColor: bg, color: text }}
                >
                    {initials}
                </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent" />
            <div className="relative z-10 p-2.5">
                <p className="line-clamp-1 text-xs leading-tight font-medium text-white">
                    {name}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-[10px] text-white/70">
                    <MapPinIcon className="size-2.5" />
                    <span className="truncate">{destination}</span>
                </p>
            </div>
        </Link>
    );
}
