"use client";

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "@/components/charts/chart-tooltip";
import { colorForEventType } from "@/lib/chart-colors";
import type { CategoryDistributionPoint } from "@/lib/types";

export function PriorityDistributionChart({
  data,
}: {
  data: CategoryDistributionPoint[];
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (data.length === 0 || total === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        No priority banner events loaded yet.
      </div>
    );
  }

  const row: Record<string, number | string> = { name: "Events" };
  data.forEach((d) => {
    row[d.name] = d.value;
  });

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={70} debounce={150}>
        <BarChart
          data={[row]}
          layout="vertical"
          margin={{ top: 0, right: 8, left: 8, bottom: 0 }}
          barCategoryGap={0}
        >
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" hide />
          <Tooltip
            content={(props) => <ChartTooltip {...props} />}
            cursor={{ fill: "transparent" }}
          />
          {data.map((d) => (
            <Bar
              key={d.name}
              dataKey={d.name}
              name={d.name}
              stackId="events"
              fill={colorForEventType(d.name)}
              radius={0}
              maxBarSize={40}
            >
              <LabelList
                dataKey={d.name}
                position="center"
                style={{ fontSize: 12, fontWeight: 600, fill: "#fff" }}
                formatter={(label) =>
                  typeof label === "number" && label > total * 0.08 ? label : ""
                }
              />
              <Cell fill={colorForEventType(d.name)} />
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: colorForEventType(d.name) }}
            />
            <span className="text-muted-foreground">{d.name}</span>
            <span className="font-semibold tabular-nums">{d.value}</span>
            <span className="text-xs text-muted-foreground">
              ({((d.value / total) * 100).toFixed(0)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
