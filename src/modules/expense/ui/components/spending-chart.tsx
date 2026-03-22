import { useState } from "react"
import { motion } from "framer-motion"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface SpendingChartProps {
  data: { month: string; amount: number }[]
  isLoading: boolean
}

const chartConfig = {
  amount: {
    label: "Spent",
    color: "var(--primary)",
  },
} satisfies ChartConfig

const periods = ["6M", "3M", "1M"] as const

export function SpendingChart({ data, isLoading }: SpendingChartProps) {
  const [period, setPeriod] = useState<(typeof periods)[number]>("6M")

  const filteredData =
    period === "6M"
      ? data
      : period === "3M"
        ? data.slice(-3)
        : data.slice(-1) ?? []

  if (isLoading) {
    return (
      <Card size="sm" className="p-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-4 h-48 w-full" />
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: 0.1,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <Card size="sm" className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            Monthly Spending
          </h3>

          <div className="flex gap-1 rounded-lg bg-muted p-0.5">
            {periods.map((p) => (
              <Button
                key={p}
                variant={period === p ? "default" : "ghost"}
                size="sm"
                aria-pressed={period === p}
                className={cn(
                  "h-6 px-2 text-xs",
                  period !== p && "text-muted-foreground"
                )}
                onClick={() => setPeriod(p)}
              >
                {p}
              </Button>
            ))}
          </div>
        </div>

        <ChartContainer
          config={chartConfig}
          className="mt-4 h-48 w-full"
        >
          <BarChart data={filteredData} barSize={24}>
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
            />

            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              fontSize={11}
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              fontSize={11}
              tickFormatter={(v) =>
                `₹${v >= 1000
                  ? `${(v / 1000).toFixed(1)}k`
                  : v
                }`
              }
            />

            <Tooltip
              formatter={(value: number) => [
                `₹${value.toLocaleString()}`,
                "Spent",
              ]}
              labelStyle={{ fontSize: 12 }}
              cursor={{
                fill: "var(--muted)",
                radius: 4,
              }}
            />

            <Bar
              dataKey="amount"
              fill="var(--color-amount)"
              radius={[4, 4, 0, 0]}
              isAnimationActive
            />
          </BarChart>
        </ChartContainer>
      </Card>
    </motion.div>
  )
}
