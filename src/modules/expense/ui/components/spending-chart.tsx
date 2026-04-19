import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SpendingChartProps {
    data: { month: string; amount: number }[];
    isLoading: boolean;
}

const EASE = [0.16, 1, 0.3, 1] as const;

const RANGES = [
    { key: "1M", months: 1 },
    { key: "3M", months: 3 },
    { key: "6M", months: 6 },
    { key: "1Y", months: 12 },
] as const;

type RangeKey = (typeof RANGES)[number]["key"];

const chartConfig = {
    amount: {
        label: "Spent",
        color: "var(--primary)",
    },
} satisfies ChartConfig;

const fmtINR = (v: number) =>
    v >= 100000
        ? `₹${(v / 100000).toFixed(1)}L`
        : v >= 1000
          ? `₹${(v / 1000).toFixed(1)}k`
          : `₹${v}`;

export function SpendingChart({ data, isLoading }: SpendingChartProps) {
    const [range, setRange] = useState<RangeKey>("6M");

    const view = useMemo(() => {
        const months = RANGES.find((r) => r.key === range)?.months ?? 6;
        return data.slice(-months);
    }, [data, range]);

    const total = useMemo(
        () => view.reduce((sum, p) => sum + p.amount, 0),
        [view]
    );
    const avg = useMemo(
        () => (view.length > 0 ? total / view.length : 0),
        [view, total]
    );
    const peak = useMemo(
        () => view.reduce((m, p) => (p.amount > m ? p.amount : m), 0),
        [view]
    );

    if (isLoading) {
        return <Skeleton className="h-72 w-full rounded-2xl" />;
    }

    return (
        <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16, ease: EASE }}
            className="rounded-2xl border bg-card"
        >
            <header className="flex flex-wrap items-end justify-between gap-4 border-b p-5">
                <div className="space-y-1">
                    <p className="text-[10px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
                        Monthly Spending
                    </p>
                    <p className="text-2xl font-semibold tabular-nums">
                        ₹{total.toLocaleString("en-IN")}
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                        Avg ₹{Math.round(avg).toLocaleString("en-IN")}
                        <span className="mx-2 opacity-40">·</span>
                        Peak ₹{peak.toLocaleString("en-IN")}
                    </p>
                </div>

                <div className="flex items-center gap-0.5 rounded-full border bg-muted/40 p-0.5 text-xs">
                    {RANGES.map((r) => {
                        const active = r.key === range;
                        return (
                            <button
                                key={r.key}
                                type="button"
                                onClick={() => setRange(r.key)}
                                aria-pressed={active}
                                className={cn(
                                    "relative rounded-full px-3 py-1 font-medium transition-colors",
                                    active
                                        ? "text-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {active && (
                                    <motion.span
                                        layoutId="chart-range-pill"
                                        className="absolute inset-0 rounded-full bg-background shadow-sm"
                                        transition={{
                                            type: "spring",
                                            bounce: 0.15,
                                            duration: 0.4,
                                        }}
                                    />
                                )}
                                <span className="relative">{r.key}</span>
                            </button>
                        );
                    })}
                </div>
            </header>

            <div className="p-2 pr-5">
                <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-64 w-full"
                >
                    <AreaChart
                        data={view}
                        margin={{ top: 16, right: 12, left: 4, bottom: 8 }}
                    >
                        <defs>
                            <linearGradient
                                id="spend-fill"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="0%"
                                    stopColor="var(--color-amount)"
                                    stopOpacity={0.35}
                                />
                                <stop
                                    offset="100%"
                                    stopColor="var(--color-amount)"
                                    stopOpacity={0}
                                />
                            </linearGradient>
                        </defs>

                        <CartesianGrid vertical={false} strokeDasharray="2 4" />

                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={4}
                            tickFormatter={fmtINR}
                            width={48}
                        />

                        <ChartTooltip
                            cursor={{
                                stroke: "var(--color-amount)",
                                strokeDasharray: "3 3",
                                strokeOpacity: 0.5,
                            }}
                            content={
                                <ChartTooltipContent
                                    indicator="line"
                                    formatter={(value) => (
                                        <div className="flex w-full items-center justify-between gap-3">
                                            <span className="text-muted-foreground">
                                                Spent
                                            </span>
                                            <span className="font-mono font-medium tabular-nums">
                                                ₹
                                                {Number(value).toLocaleString(
                                                    "en-IN"
                                                )}
                                            </span>
                                        </div>
                                    )}
                                />
                            }
                        />

                        <Area
                            type="monotone"
                            dataKey="amount"
                            stroke="var(--color-amount)"
                            strokeWidth={2}
                            fill="url(#spend-fill)"
                            activeDot={{
                                r: 5,
                                fill: "var(--color-amount)",
                                stroke: "var(--background)",
                                strokeWidth: 2,
                            }}
                        />
                    </AreaChart>
                </ChartContainer>
            </div>
        </motion.section>
    );
}
