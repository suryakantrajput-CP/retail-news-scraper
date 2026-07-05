"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "@/components/charts/chart-tooltip";
import { colorForGrocerySource, VIZ_AXIS, VIZ_GRID } from "@/lib/chart-colors";
import type { CategoryDistributionPoint } from "@/lib/types";

function sourceLabel(source: string) {
  return source
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function CategoryDistributionChart({
  data,
}: {
  data: CategoryDistributionPoint[];
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No grocery news sources loaded yet.
      </div>
    );
  }

  const chartData = [...data]
    .sort((a, b) => b.value - a.value)
    .map((d) => ({ ...d, label: sourceLabel(d.name) }));

  return (
    <ResponsiveContainer
      width="100%"
      height={Math.max(220, chartData.length * 34)}
      debounce={150}
    >
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 4, right: 28, left: 8, bottom: 4 }}
        barCategoryGap={10}
      >
        <CartesianGrid horizontal={false} stroke={VIZ_GRID} strokeWidth={1} />
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="label"
          width={140}
          tick={{ fontSize: 12, fill: VIZ_AXIS }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          content={(props) => <ChartTooltip {...props} />}
          cursor={{ fill: "var(--muted)", opacity: 0.4 }}
        />
        <Bar dataKey="value" name="Articles" radius={[0, 4, 4, 0]} maxBarSize={20}>
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={colorForGrocerySource(entry.name)} />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            style={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
