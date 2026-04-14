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
    const searchText = search?.trim() || undefined;
    const isSearching = !!searchText;

    const searchQuery = useBrowseBlogs(searchText);
    const feedQuery = useBrowseBlogs(undefined);

    const activeQuery = isSearching ? searchQuery : feedQuery;
    const results = activeQuery.blogs;
    const isLoading = activeQuery.isLoading;
    const canLoadMore = !activeQuery.isDone;
    const isLoadingMore = canLoadMore && results.length > 0 && !isLoading;
    const handleLoadMore = () => activeQuery.loadMore();

    const showFallback =
        isSearching &&
        !isLoading &&
        results.length === 0 &&
        feedQuery.blogs.length > 0;

    const headerText = isSearching
        ? isLoading
            ? `Searching for \u201c${search}\u201d\u2026`
            : results.length === 0
              ? `No results for \u201c${search}\u201d`
              : `${results.length} ${results.length === 1 ? "result" : "results"} for \u201c${search}\u201d`
        : "Recommended for you";

    return (
        <div className="flex h-full flex-col">
            <div className="mx-auto w-full max-w-3xl shrink-0 space-y-4 p-4">
                <BlogSearch />
                <p className="text-xs font-medium text-muted-foreground">
                    {headerText}
                </p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="mx-auto w-full max-w-3xl space-y-6 px-4 pb-4">
                    {isLoading ? (
                        <BlogListSkeleton />
                    ) : results.length === 0 && !showFallback ? (
                        <BlogEmptyState hasSearch={isSearching} />
                    ) : (
                        <>
                            {results.length > 0 && (
                                <div className="space-y-3">
                                    {results.map((blog) => (
                                        <BlogCard
                                            key={blog._id}
                                            blogId={blog._id}
                                            title={blog.title}
                                            destination={blog.tripDestination}
                                            coverImage={blog.coverImage}
                                            publishedAt={blog.publishedAt}
                                            avgRating={blog.avgRating}
                                            totalRatings={blog.totalRatings}
                                        />
                                    ))}
                                </div>
                            )}

                            {results.length > 0 && (
                                <InfiniteScrollTrigger
                                    canLoadMore={canLoadMore}
                                    isLoadingMore={isLoadingMore}
                                    onLoadMore={handleLoadMore}
                                    noMoreText=""
                                />
                            )}

                            {showFallback && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 pt-2">
                                        <div className="h-px flex-1 bg-border/60" />
                                        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                            You might like
                                        </span>
                                        <div className="h-px flex-1 bg-border/60" />
                                    </div>
                                    <div className="space-y-3">
                                        {feedQuery.blogs.map((blog) => (
                                            <BlogCard
                                                key={blog._id}
                                                blogId={blog._id}
                                                title={blog.title}
                                                destination={
                                                    blog.tripDestination
                                                }
                                                coverImage={blog.coverImage}
                                                publishedAt={blog.publishedAt}
                                                avgRating={blog.avgRating}
                                                totalRatings={blog.totalRatings}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
