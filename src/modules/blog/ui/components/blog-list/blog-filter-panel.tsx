import { useAtom } from "jotai";
import { MapPinIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { blogFiltersAtom, type BlogFilters } from "../../../atoms";
import { useLocation } from "@/modules/plan/hooks/use-location";
import { useDebouncedInput } from "@/hooks/use-debounced-value";
import { TagInput } from "../tag-input";
import { cn } from "@/lib/utils";
import { SUGGESTED_TAGS } from "@/modules/blog/constants";

function parseNumberInput(value: string): number | undefined {
    if (value === "") return undefined;
    const n = Number(value);
    return Number.isNaN(n) ? undefined : n;
}

export function BlogFilterPanel() {
    const [filters, setFilters] = useAtom(blogFiltersAtom);
    const {
        coords,
        error: locationError,
        isLoading: locationLoading,
        isSupported: locationSupported,
    } = useLocation();

    const patch = (next: Partial<BlogFilters>) =>
        setFilters((prev) => ({ ...prev, ...next }));

    const [localMinBudget, setLocalMinBudget] = useDebouncedInput(
        filters.minBudget,
        (v) => patch({ minBudget: v })
    );
    const [localMaxBudget, setLocalMaxBudget] = useDebouncedInput(
        filters.maxBudget,
        (v) => patch({ maxBudget: v })
    );
    const [localMinDays, setLocalMinDays] = useDebouncedInput(
        filters.minDays,
        (v) => patch({ minDays: v })
    );
    const [localMaxDays, setLocalMaxDays] = useDebouncedInput(
        filters.maxDays,
        (v) => patch({ maxDays: v })
    );
    const [localRadius, setLocalRadius] = useDebouncedInput(
        filters.nearMe?.radiusKm ?? 50,
        (v) => {
            if (!filters.nearMe) return;
            patch({ nearMe: { ...filters.nearMe, radiusKm: v } });
        }
    );
    const [localTags, setLocalTags] = useDebouncedInput(filters.tags, (v) =>
        patch({ tags: v })
    );

    const toggleNearMe = () => {
        if (filters.nearMe) {
            patch({ nearMe: undefined });
            return;
        }
        if (!coords) return;
        patch({
            nearMe: {
                lat: coords.latitude,
                lng: coords.longitude,
                radiusKm: 50,
            },
        });
    };

    return (
        <div className="flex flex-col">
            <FilterSection label="Tags">
                <TagInput
                    value={localTags}
                    onChange={setLocalTags}
                    suggestions={SUGGESTED_TAGS}
                    placeholder="Search by any tag…"
                />
            </FilterSection>

            <FilterSection label="Budget">
                <div className="grid grid-cols-2 gap-2">
                    <Input
                        type="number"
                        inputMode="numeric"
                        placeholder="Min"
                        value={localMinBudget ?? ""}
                        onChange={(e) =>
                            setLocalMinBudget(parseNumberInput(e.target.value))
                        }
                    />
                    <Input
                        type="number"
                        inputMode="numeric"
                        placeholder="Max"
                        value={localMaxBudget ?? ""}
                        onChange={(e) =>
                            setLocalMaxBudget(parseNumberInput(e.target.value))
                        }
                    />
                </div>
            </FilterSection>

            <FilterSection label="Duration">
                <div className="grid grid-cols-2 gap-2">
                    <Input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        placeholder="Min days"
                        value={localMinDays ?? ""}
                        onChange={(e) =>
                            setLocalMinDays(parseNumberInput(e.target.value))
                        }
                    />
                    <Input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        placeholder="Max days"
                        value={localMaxDays ?? ""}
                        onChange={(e) =>
                            setLocalMaxDays(parseNumberInput(e.target.value))
                        }
                    />
                </div>
            </FilterSection>

            <FilterSection label="Nearby" last>
                <Button
                    variant={filters.nearMe ? "default" : "outline"}
                    size="sm"
                    onClick={toggleNearMe}
                    disabled={!coords}
                    className="w-full justify-start gap-2"
                >
                    <MapPinIcon className="size-3.5" />
                    {filters.nearMe
                        ? `Within ${localRadius} km of me`
                        : coords
                          ? "Only show blogs near me"
                          : locationLoading
                            ? "Getting your location…"
                            : !locationSupported
                              ? "Location not available on this device"
                              : locationError?.code === 1
                                ? "Location permission denied"
                                : locationError
                                  ? "Could not get location"
                                  : "Enable location to filter nearby"}
                </Button>
                {filters.nearMe && (
                    <div className="px-1 pt-3">
                        <Slider
                            value={[localRadius]}
                            min={5}
                            max={500}
                            step={5}
                            onValueChange={(v) => {
                                setLocalRadius(Array.isArray(v) ? v[0] : v);
                            }}
                        />
                        <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
                            <span>5 km</span>
                            <span>500 km</span>
                        </div>
                    </div>
                )}
            </FilterSection>
        </div>
    );
}

function FilterSection({
    label,
    children,
    last,
}: {
    label: string;
    children: React.ReactNode;
    last?: boolean;
}) {
    return (
        <div className={cn("px-5 py-5", !last && "border-b border-border/50")}>
            <Label className="mb-3 block text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                {label}
            </Label>
            {children}
        </div>
    );
}
