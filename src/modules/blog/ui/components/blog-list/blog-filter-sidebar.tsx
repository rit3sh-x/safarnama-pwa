import { useSetAtom } from "jotai";
import { ChevronDownIcon, SlidersHorizontalIcon, XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { blogFiltersAtom } from "../../../atoms";
import { BlogFilterPanel } from "./blog-filter-panel";
import { useBlogFilterActiveCount } from "@/modules/blog/hooks/use-blog-filters";

export function BlogFilterTrigger({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
}) {
    const activeCount = useBlogFilterActiveCount();

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(!open)}
            aria-expanded={open}
            aria-label="Toggle filters"
            className="gap-2"
        >
            <SlidersHorizontalIcon className="size-3.5" />
            <span>Filters</span>
            {activeCount > 0 && (
                <Badge
                    variant="secondary"
                    className="h-5 min-w-5 px-1.5 text-[10px]"
                >
                    {activeCount}
                </Badge>
            )}
            <ChevronDownIcon
                className={cn(
                    "size-3.5 text-muted-foreground transition-transform duration-200",
                    open && "rotate-180"
                )}
            />
        </Button>
    );
}

export function BlogFilterSidebar({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
}) {
    const isMobile = useIsMobile();
    const activeCount = useBlogFilterActiveCount();
    const setFilters = useSetAtom(blogFiltersAtom);

    const clearAll = () => setFilters({ tags: [] });

    if (isMobile) {
        return (
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent
                    side="left"
                    className="flex w-full max-w-sm flex-col p-0"
                >
                    <SheetHeader className="border-b border-border/50 px-5 py-4">
                        <SheetTitle className="text-base">Filters</SheetTitle>
                        <SheetDescription className="text-xs">
                            Refine your feed
                        </SheetDescription>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto">
                        <BlogFilterPanel />
                    </div>
                    {activeCount > 0 && (
                        <div className="border-t border-border/50 px-5 py-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={clearAll}
                                className="w-full gap-2"
                            >
                                <XIcon className="size-3.5" />
                                Clear all
                            </Button>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        );
    }

    return (
        <aside
            aria-hidden={!open}
            inert={!open}
            className={cn(
                "sticky top-26 shrink-0 self-start overflow-hidden transition-[width,opacity] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
                open ? "w-72 opacity-100" : "w-0 opacity-0"
            )}
        >
            <div className="flex max-h-[calc(100vh-7rem)] w-72 flex-col rounded-xl border border-border/50 bg-muted/15">
                <div className="flex shrink-0 items-center justify-between border-b border-border/50 px-5 py-4">
                    <h2 className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                        Filters
                    </h2>
                    {activeCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearAll}
                            className="h-auto px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
                        >
                            Clear all
                        </Button>
                    )}
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto">
                    <BlogFilterPanel />
                </div>
            </div>
        </aside>
    );
}
