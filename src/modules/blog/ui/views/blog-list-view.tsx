import { useState } from "react";
import { useAtomValue } from "jotai";
import { useBrowseBlogs } from "../../hooks/use-blogs";
import { InfiniteScrollTrigger } from "@/components/infinite-scroll-trigger";
import { BlogSearch } from "../components/blog-list/blog-search";
import { BlogCard } from "../components/blog-list/blog-card";
import { BlogListSkeleton } from "../components/blog-list/blog-list-skeleton";
import { BlogEmptyState } from "../components/blog-list/blog-empty-state";
import {
    BlogFilterSidebar,
    BlogFilterTrigger,
} from "../components/blog-list/blog-filter-sidebar";
import { blogSearchAtom, blogFiltersAtom } from "../../atoms";
import { useBlogFilterActiveCount } from "../../hooks/use-blog-filters";

export function BlogListView() {
    const [filtersOpen, setFiltersOpen] = useState(false);
    const search = useAtomValue(blogSearchAtom);
    const filters = useAtomValue(blogFiltersAtom);
    const activeFilterCount = useBlogFilterActiveCount();
    const searchText = search?.trim() || undefined;

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
            return searchText ? `Searching for “${search}”…` : "Loading…";
        }
        if (searchText) {
            const count = results.length;
            return count === 0
                ? `No results for “${search}”`
                : `${count} ${count === 1 ? "result" : "results"} for “${search}”`;
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
        <div className="h-full overflow-y-auto">
            <div className="w-full px-4 sm:px-6 lg:px-10">
                <div className="sticky top-0 z-20 -mx-4 flex flex-col gap-3 bg-background/85 px-4 py-4 backdrop-blur-md supports-backdrop-filter:bg-background/70 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
                    <div className="flex items-center gap-3">
                        <BlogFilterTrigger
                            open={filtersOpen}
                            onOpenChange={setFiltersOpen}
                        />
                        <div className="min-w-0 flex-1">
                            <BlogSearch />
                        </div>
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">
                        {headerText}
                    </p>
                </div>

                <div className="flex gap-4 pt-2 pb-8">
                    <BlogFilterSidebar
                        open={filtersOpen}
                        onOpenChange={setFiltersOpen}
                    />
                    <div className="min-w-0 flex-1">
                        {isLoading ? (
                            <BlogListSkeleton />
                        ) : results.length === 0 ? (
                            <BlogEmptyState hasSearch={isFiltering} />
                        ) : (
                            <>
                                <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
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

                                <div className="mt-4">
                                    <InfiniteScrollTrigger
                                        canLoadMore={canLoadMore}
                                        isLoadingMore={isLoadingMore}
                                        onLoadMore={handleLoadMore}
                                        noMoreText=""
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
