import { format } from "date-fns";

interface BlogFactsStripProps {
    startDate?: number;
    endDate?: number;
    budget?: number;
    currency?: string;
    tags?: string[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

function formatBudget(amount: number, currency?: string): string {
    const cur = currency ?? "USD";
    try {
        return new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: cur,
            maximumFractionDigits: 0,
        }).format(amount);
    } catch {
        return `${amount} ${cur}`;
    }
}

function formatDateRange(start: number, end: number): string {
    const a = new Date(start);
    const b = new Date(end);
    const sameYear = a.getFullYear() === b.getFullYear();
    if (sameYear) {
        return `${format(a, "MMM d")} – ${format(b, "MMM d, yyyy")}`;
    }
    return `${format(a, "MMM d, yyyy")} – ${format(b, "MMM d, yyyy")}`;
}

export function BlogFactsStrip({
    startDate,
    endDate,
    budget,
    currency,
    tags,
}: BlogFactsStripProps) {
    const hasDates = startDate !== undefined && endDate !== undefined;
    const days = hasDates
        ? Math.floor((endDate! - startDate!) / DAY_MS) + 1
        : null;

    const facts: Array<{ label: string; value: string }> = [];
    if (hasDates) {
        facts.push({
            label: "Dates",
            value: formatDateRange(startDate!, endDate!),
        });
    }
    if (days !== null) {
        facts.push({
            label: "Duration",
            value: `${days} ${days === 1 ? "day" : "days"}`,
        });
    }
    if (budget !== undefined) {
        facts.push({
            label: "Budget",
            value: formatBudget(budget, currency),
        });
    }

    const hasTags = tags && tags.length > 0;
    if (facts.length === 0 && !hasTags) return null;

    return (
        <div>
            {facts.length > 0 && (
                <dl className="grid grid-cols-1 divide-y divide-border/70 border-y border-border/70 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                    {facts.map((fact) => (
                        <div
                            key={fact.label}
                            className="px-1 py-4 first:pl-0 sm:px-5 sm:first:pl-0"
                        >
                            <dt className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                                {fact.label}
                            </dt>
                            <dd className="mt-1.5 font-serif text-base text-foreground">
                                {fact.value}
                            </dd>
                        </div>
                    ))}
                </dl>
            )}

            {hasTags && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                        <span
                            key={tag}
                            className="rounded-full bg-foreground/6 px-2.5 py-0.5 text-xs text-foreground/80"
                        >
                            #{tag}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
