import { useAtom } from "jotai"
import { blogSearchAtom } from "@/modules/blog/atoms"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SearchIcon, XIcon } from "lucide-react"
import { useDebouncedSearch } from "@/hooks/use-debounced-search"
import { useCallback } from "react"

export function BlogSearch() {
  const [search, setSearch] = useAtom(blogSearchAtom)

  const commitSearch = useCallback(
    (value: string) => setSearch(value || undefined),
    [setSearch]
  )

  const { value, onChange, clear: onClear } = useDebouncedSearch(
    search ?? "",
    commitSearch,
    { debounceMs: 400 }
  )

  return (
    <div className="relative">
      <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        aria-label="Search blogs"
        placeholder="Search blogs..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 pr-8"
      />
      {value && (
        <Button
          aria-label="Clear search"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 size-7 -translate-y-1/2"
          onClick={onClear}
        >
          <XIcon className="size-3.5" />
        </Button>
      )}
    </div>
  )
}
