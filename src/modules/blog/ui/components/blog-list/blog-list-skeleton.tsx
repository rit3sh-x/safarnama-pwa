import { Skeleton } from "@/components/ui/skeleton";

export function BlogListSkeleton() {
    return (
        <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <div
                    key={i}
                    className="flex gap-4 rounded-xl border border-border p-4"
                >
                    <Skeleton className="size-16 shrink-0 rounded-lg sm:size-20" />
                    <div className="flex flex-1 flex-col gap-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-3 w-1/3" />
                    </div>
                </div>
            ))}
        </div>
    );
}
