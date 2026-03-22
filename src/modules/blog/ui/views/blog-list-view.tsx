import { useBrowseBlogs } from "../../hooks/use-blogs"
import { InfiniteScrollTrigger } from "@/components/infinite-scroll-trigger"
import { BlogSearch } from "../components/blog-list/blog-search"
import { BlogCard } from "../components/blog-list/blog-card"
import { BlogListSkeleton } from "../components/blog-list/blog-list-skeleton"
import { BlogEmptyState } from "../components/blog-list/blog-empty-state"
import { blogSearchAtom } from "../../atoms"
import { useAtomValue } from "jotai"

export function BlogListView() {
  const search = useAtomValue(blogSearchAtom)
  const { blogs, isLoading, isDone, loadMore } = useBrowseBlogs(search)

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl space-y-6 p-4">
        <BlogSearch />

        {isLoading && <BlogListSkeleton />}

        {!isLoading && blogs.length === 0 && (
          <BlogEmptyState hasSearch={!!search} />
        )}

        {blogs.length > 0 && (
          <div className="space-y-3">
            {blogs.map((blog) => (
              <BlogCard
                key={blog._id}
                blogId={blog._id}
                title={blog.title}
                destination={blog.tripDestination}
                coverImage={blog.coverImage}
                publishedAt={blog.publishedAt}
              />
            ))}
          </div>
        )}

        <InfiniteScrollTrigger
          canLoadMore={!isDone}
          isLoadingMore={!isLoading && !isDone && blogs.length > 0}
          onLoadMore={loadMore}
          noMoreText=""
        />
      </div>
    </div>
  )
}
