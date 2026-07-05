"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "@/components/charts/chart-tooltip";
import { SERIES_COLORS, VIZ_AXIS, VIZ_GRID } from "@/lib/chart-colors";
import type { TrendPoint } from "@/lib/types";

function formatDateTick(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function TrendChart({ data }: { data: TrendPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Not enough dated records yet to plot a trend.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280} debounce={150}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={VIZ_GRID} strokeWidth={1} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDateTick}
          tick={{ fontSize: 11, fill: VIZ_AXIS }}
          axisLine={{ stroke: VIZ_GRID }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: VIZ_AXIS }}
          axisLine={false}
          tickLine={false}
          width={32}
        />
        <Tooltip content={(props) => <ChartTooltip {...props} />} />
        <Legend
          verticalAlign="top"
          height={28}
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12 }}
        />
        <Area
          type="monotone"
          dataKey="grocery"
          name="Grocery News"
          stroke={SERIES_COLORS.grocery}
          strokeWidth={2}
          fill={SERIES_COLORS.grocery}
          fillOpacity={0.1}
          dot={{ r: 3, strokeWidth: 2, stroke: "var(--card)", fill: SERIES_COLORS.grocery }}
          activeDot={{ r: 5 }}
        />
        <Area
          type="monotone"
          dataKey="priority"
          name="Priority Banner"
          stroke={SERIES_COLORS.priority}
          strokeWidth={2}
          fill={SERIES_COLORS.priority}
          fillOpacity={0.1}
          dot={{ r: 3, strokeWidth: 2, stroke: "var(--card)", fill: SERIES_COLORS.priority }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
