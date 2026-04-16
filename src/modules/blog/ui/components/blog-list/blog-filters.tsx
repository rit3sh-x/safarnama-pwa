import { useState } from "react";
import { useAtom } from "jotai";
import {
    ChevronDownIcon,
    MapPinIcon,
    SlidersHorizontalIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

export function BlogFilters() {
    const [filters, setFilters] = useAtom(blogFiltersAtom);
    const [open, setOpen] = useState(false);
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

    const activeCount =
        filters.tags.length +
        (filters.minBudget !== undefined || filters.maxBudget !== undefined
            ? 1
            : 0) +
        (filters.minDays !== undefined || filters.maxDays !== undefined
            ? 1
            : 0) +
        (filters.nearMe ? 1 : 0);

    const clearAll = () => setFilters({ tags: [] });

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
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOpen((v) => !v)}
                    className="gap-1.5"
                >
                    <SlidersHorizontalIcon className="size-3.5" />
                    Filters
                    {activeCount > 0 && (
                        <Badge
                            variant="secondary"
                            className="ml-1 h-5 min-w-5 justify-center px-1.5 text-[10px]"
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
                {activeCount > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAll}
                        className="text-xs text-muted-foreground"
                    >
                        Clear all
                    </Button>
                )}
            </div>

            {open && (
                <div className="overflow-hidden rounded-xl border border-border bg-muted/15">
                    <FilterRow label="Tags">
                        <TagInput
                            value={filters.tags}
                            onChange={(tags) => patch({ tags })}
                            suggestions={SUGGESTED_TAGS}
                            placeholder="Search by any tag…"
                        />
                    </FilterRow>

                    <FilterRow label="Budget">
                        <div className="grid grid-cols-2 gap-2">
                            <Input
                                type="number"
                                inputMode="numeric"
                                placeholder="Min"
                                value={localMinBudget ?? ""}
                                onChange={(e) =>
                                    setLocalMinBudget(
                                        parseNumberInput(e.target.value)
                                    )
                                }
                            />
                            <Input
                                type="number"
                                inputMode="numeric"
                                placeholder="Max"
                                value={localMaxBudget ?? ""}
                                onChange={(e) =>
                                    setLocalMaxBudget(
                                        parseNumberInput(e.target.value)
                                    )
                                }
                            />
                        </div>
                    </FilterRow>

                    <FilterRow label="Duration">
                        <div className="grid grid-cols-2 gap-2">
                            <Input
                                type="number"
                                inputMode="numeric"
                                min={1}
                                placeholder="Min days"
                                value={localMinDays ?? ""}
                                onChange={(e) =>
                                    setLocalMinDays(
                                        parseNumberInput(e.target.value)
                                    )
                                }
                            />
                            <Input
                                type="number"
                                inputMode="numeric"
                                min={1}
                                placeholder="Max days"
                                value={localMaxDays ?? ""}
                                onChange={(e) =>
                                    setLocalMaxDays(
                                        parseNumberInput(e.target.value)
                                    )
                                }
                            />
                        </div>
                    </FilterRow>

                    <FilterRow label="Nearby" last>
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
                                    ? "Getting your location\u2026"
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
                                        setLocalRadius(
                                            Array.isArray(v) ? v[0] : v
                                        );
                                    }}
                                />
                                <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
                                    <span>5 km</span>
                                    <span>500 km</span>
                                </div>
                            </div>
                        )}
                    </FilterRow>
                </div>
            )}
        </div>
    );
}

function FilterRow({
    label,
    children,
    last,
}: {
    label: string;
    children: React.ReactNode;
    last?: boolean;
}) {
    return (
        <div className={cn("px-5 py-4", !last && "border-b border-border/60")}>
            <Label className="mb-3 block text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                {label}
            </Label>
            {children}
        </div>
    );
}
