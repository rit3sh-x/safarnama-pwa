import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { usePlaces } from "@/modules/plan/hooks/use-places";
import type { Id } from "@backend/dataModel";
import { TagInput } from "./tag-input";
import { SUGGESTED_TAGS } from "../../constants";

export type BlogMetaValue = {
    tags: string[];
    startDate?: number;
    endDate?: number;
    budget?: number;
    currency?: string;
    placeIds: Id<"place">[];
};

interface BlogMetaPanelProps {
    tripId: Id<"trip">;
    value: BlogMetaValue;
    onChange: (patch: Partial<BlogMetaValue>) => void;
}

const CURRENCIES = ["USD", "INR", "EUR", "GBP", "JPY"];

function toInputDate(ms?: number): string {
    if (!ms) return "";
    const d = new Date(ms);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function fromInputDate(str: string): number | undefined {
    if (!str) return undefined;
    const t = new Date(str).getTime();
    return Number.isNaN(t) ? undefined : t;
}

function parseNumberInput(value: string): number | undefined {
    if (value === "") return undefined;
    const n = Number(value);
    return Number.isNaN(n) ? undefined : n;
}

export function BlogMetaPanel({ tripId, value, onChange }: BlogMetaPanelProps) {
    const { places, isLoading: placesLoading } = usePlaces(tripId);

    const togglePlace = useCallback(
        (placeId: Id<"place">) => {
            const has = value.placeIds.includes(placeId);
            onChange({
                placeIds: has
                    ? value.placeIds.filter((id) => id !== placeId)
                    : [...value.placeIds, placeId],
            });
        },
        [value.placeIds, onChange]
    );

    return (
        <div className="mt-16 space-y-12 border-t border-border pt-10 pb-20">
            <Section
                eyebrow="Trip facts"
                caption="The bones of the journey. Filled in once, used everywhere this blog appears."
            >
                <div className="space-y-6">
                    <Field label="Dates">
                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                id="blog-start-date"
                                type="date"
                                aria-label="Start date"
                                value={toInputDate(value.startDate)}
                                onChange={(e) =>
                                    onChange({
                                        startDate: fromInputDate(
                                            e.target.value
                                        ),
                                    })
                                }
                            />
                            <Input
                                id="blog-end-date"
                                type="date"
                                aria-label="End date"
                                value={toInputDate(value.endDate)}
                                onChange={(e) =>
                                    onChange({
                                        endDate: fromInputDate(e.target.value),
                                    })
                                }
                            />
                        </div>
                    </Field>

                    <Field label="Budget">
                        <div className="grid grid-cols-[1fr_120px] gap-3">
                            <Input
                                id="blog-budget"
                                type="number"
                                inputMode="numeric"
                                min={0}
                                placeholder="0"
                                value={value.budget ?? ""}
                                onChange={(e) =>
                                    onChange({
                                        budget: parseNumberInput(
                                            e.target.value
                                        ),
                                    })
                                }
                            />
                            <Select
                                value={value.currency ?? "USD"}
                                onValueChange={(v) =>
                                    onChange({ currency: v || undefined })
                                }
                            >
                                <SelectTrigger
                                    id="blog-currency"
                                    aria-label="Currency"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CURRENCIES.map((c) => (
                                        <SelectItem key={c} value={c}>
                                            {c}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </Field>

                    <Field
                        label="Tags"
                        caption="Pick from suggestions or type your own. Press Enter or comma to add."
                    >
                        <TagInput
                            value={value.tags}
                            onChange={(tags) => onChange({ tags })}
                            suggestions={SUGGESTED_TAGS}
                            placeholder="solo, mountain, food…"
                        />
                    </Field>
                </div>
            </Section>

            <Section
                eyebrow="Places you visited"
                caption="Tick the spots from your plan that made it into the story. Used to surface this blog when readers filter by what's near them."
            >
                {placesLoading ? (
                    <p className="text-sm text-muted-foreground">
                        Loading places…
                    </p>
                ) : places.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
                        No places saved on this trip yet. Add some in the plan
                        view, then come back to pick them.
                    </p>
                ) : (
                    <ul className="divide-y divide-border/60">
                        {places.map((place) => {
                            const checked = value.placeIds.includes(place._id);
                            return (
                                <li key={place._id}>
                                    <label className="flex cursor-pointer items-start gap-3 py-3 transition-colors hover:bg-muted/30">
                                        <Checkbox
                                            checked={checked}
                                            onCheckedChange={() =>
                                                togglePlace(place._id)
                                            }
                                            className="mt-0.5"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-serif text-base text-foreground">
                                                {place.name}
                                            </p>
                                            {place.address && (
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {place.address}
                                                </p>
                                            )}
                                        </div>
                                    </label>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </Section>
        </div>
    );
}

function Section({
    eyebrow,
    caption,
    children,
}: {
    eyebrow: string;
    caption?: string;
    children: React.ReactNode;
}) {
    return (
        <section>
            <header className="mb-6">
                <p className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                    {eyebrow}
                </p>
                {caption && (
                    <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
                        {caption}
                    </p>
                )}
            </header>
            {children}
        </section>
    );
}

function Field({
    label,
    caption,
    children,
}: {
    label: string;
    caption?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-2">
            <Label className="text-xs font-medium text-foreground">
                {label}
            </Label>
            {children}
            {caption && (
                <p className="text-[11px] text-muted-foreground">{caption}</p>
            )}
        </div>
    );
}
