import { useBrowseBlogs } from "../../hooks/use-blogs";
import { InfiniteScrollTrigger } from "@/components/infinite-scroll-trigger";
import { BlogSearch } from "../components/blog-list/blog-search";
import { BlogCard } from "../components/blog-list/blog-card";
import { BlogListSkeleton } from "../components/blog-list/blog-list-skeleton";
import { BlogEmptyState } from "../components/blog-list/blog-empty-state";
import { blogSearchAtom } from "../../atoms";
import { useAtomValue } from "jotai";

export function BlogListView() {
    const search = useAtomValue(blogSearchAtom);

    return (
        <div className="flex h-full flex-col">
            <div className="mx-auto w-full max-w-3xl shrink-0 space-y-4 px-4 pt-4">
                <BlogSearch />
                <p className="text-xs font-medium text-muted-foreground">
                    {search
                        ? `Results for \u201c${search}\u201d`
                        : "Recommended for you"}
                </p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="mx-auto w-full max-w-3xl px-4 pb-4">
                    {search ? (
                        <BlogSearchResults search={search} />
                    ) : (
                        <BlogFeed />
                    )}
                </div>
            </div>
        </div>
    );
}

function BlogFeed() {
    const { blogs, isLoading, isDone, loadMore } = useBrowseBlogs("");

    if (isLoading) return <BlogListSkeleton />;
    if (blogs.length === 0) return <BlogEmptyState hasSearch={false} />;

    return (
        <>
            <div className="space-y-3">
                {blogs.map((blog) => (
                    <BlogCard
                        key={blog._id}
                        blogId={blog._id}
                        title={blog.title}
                        destination={blog.tripDestination}
                        coverImage={blog.coverImage}
                        publishedAt={blog.publishedAt}
                        avgRating={(blog as { avgRating?: number }).avgRating}
                        totalRatings={
                            (blog as { totalRatings?: number }).totalRatings
                        }
                    />
                ))}
            </div>
            <InfiniteScrollTrigger
                canLoadMore={!isDone}
                isLoadingMore={!isLoading && !isDone && blogs.length > 0}
                onLoadMore={loadMore}
                noMoreText=""
            />
        </>
    );
}

function BlogSearchResults({ search }: { search: string }) {
    const { blogs, isLoading, isDone, loadMore } = useBrowseBlogs(search);

    if (isLoading) return <BlogListSkeleton />;
    if (blogs.length === 0) return <BlogEmptyState hasSearch />;

    return (
        <>
            <div className="space-y-3">
                {blogs.map((blog) => (
                    <BlogCard
                        key={blog._id}
                        blogId={blog._id}
                        title={blog.title}
                        destination={blog.tripDestination}
                        coverImage={blog.coverImage}
                        publishedAt={blog.publishedAt}
                        avgRating={(blog as { avgRating?: number }).avgRating}
                        totalRatings={
                            (blog as { totalRatings?: number }).totalRatings
                        }
                    />
                ))}
            </div>
            <InfiniteScrollTrigger
                canLoadMore={!isDone}
                isLoadingMore={!isLoading && !isDone && blogs.length > 0}
                onLoadMore={loadMore}
                noMoreText=""
            />
        </>
    );
}
