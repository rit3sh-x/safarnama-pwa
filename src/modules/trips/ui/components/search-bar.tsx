import { Input } from "@/components/ui/input";
import { SearchIcon, XIcon } from "lucide-react";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { useSearchParams } from "../../hooks/use-search-params";
import { Button } from "@/components/ui/button";

export const SearchBar = () => {
    const { search, setSearch } = useSearchParams();
    const { value, onChange, clear } = useDebouncedSearch(
        search ?? "",
        setSearch
    );

    return (
        <div className="flex h-11 w-full items-center rounded-full bg-muted/40 px-4">
            <SearchIcon className="h-4 w-4 text-muted-foreground" />

            <Input
                className="h-full flex-1 border-0 bg-transparent px-2 focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="Search"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />

            {value.length > 0 && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full"
                    onClick={clear}
                >
                    <XIcon className="h-4 w-4 text-muted-foreground" />
                </Button>
            )}
        </div>
    );
};
