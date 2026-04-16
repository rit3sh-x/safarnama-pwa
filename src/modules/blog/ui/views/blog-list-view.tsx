import { useBrowseBlogs } from "../../hooks/use-blogs";
import { InfiniteScrollTrigger } from "@/components/infinite-scroll-trigger";
import { BlogSearch } from "../components/blog-list/blog-search";
import { BlogCard } from "../components/blog-list/blog-card";
import { BlogListSkeleton } from "../components/blog-list/blog-list-skeleton";
import { BlogEmptyState } from "../components/blog-list/blog-empty-state";
import { BlogFilters } from "../components/blog-list/blog-filters";
import { blogSearchAtom, blogFiltersAtom } from "../../atoms";
import { useAtomValue } from "jotai";

export function BlogListView() {
    const search = useAtomValue(blogSearchAtom);
    const filters = useAtomValue(blogFiltersAtom);
    const searchText = search?.trim() || undefined;

    const activeFilterCount =
        filters.tags.length +
        (filters.minBudget !== undefined || filters.maxBudget !== undefined
            ? 1
            : 0) +
        (filters.minDays !== undefined || filters.maxDays !== undefined
            ? 1
            : 0) +
        (filters.nearMe ? 1 : 0);
    const hasFilters = activeFilterCount > 0;
    const isFiltering = !!searchText || hasFilters;

    const query = useBrowseBlogs(searchText, filters);
    const results = query.blogs;
    const isLoading = query.isLoading;
    const canLoadMore = !query.isDone;
    const isLoadingMore = canLoadMore && results.length > 0 && !isLoading;
    const handleLoadMore = () => query.loadMore();

    const headerText = (() => {
        if (isLoading) {
            return searchText
                ? `Searching for \u201c${search}\u201d\u2026`
                : "Loading\u2026";
        }
        if (searchText) {
            const count = results.length;
            return count === 0
                ? `No results for \u201c${search}\u201d`
                : `${count} ${count === 1 ? "result" : "results"} for \u201c${search}\u201d`;
        }
        if (hasFilters) {
            const count = results.length;
            return count === 0
                ? "No blogs match your filters"
                : `${count} ${count === 1 ? "blog" : "blogs"} matching your filters`;
        }
        return "Recommended for you";
    })();

    return (
        <div className="flex h-full flex-col">
            <div className="mx-auto w-full max-w-3xl shrink-0 space-y-4 p-4">
                <BlogSearch />
                <BlogFilters />
                <p className="text-xs font-medium text-muted-foreground">
                    {headerText}
                </p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="mx-auto w-full max-w-3xl space-y-6 px-4 pb-4">
                    {isLoading ? (
                        <BlogListSkeleton />
                    ) : results.length === 0 ? (
                        <BlogEmptyState hasSearch={isFiltering} />
                    ) : (
                        <>
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
                                        tags={blog.tags}
                                    />
                                ))}
                            </div>

                            <InfiniteScrollTrigger
                                canLoadMore={canLoadMore}
                                isLoadingMore={isLoadingMore}
                                onLoadMore={handleLoadMore}
                                noMoreText=""
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
