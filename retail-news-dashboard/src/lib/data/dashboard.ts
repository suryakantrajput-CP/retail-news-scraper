import { format } from "date-fns";
import { getGroceryNews } from "@/lib/data/grocery-news";
import { getPriorityBanner } from "@/lib/data/priority-banner";
import type {
  CategoryDistributionPoint,
  DashboardSummary,
  TrendPoint,
} from "@/lib/types";

function safeParseDate(value: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function tally(values: string[]): CategoryDistributionPoint[] {
  const counts = new Map<string, number>();
  for (const v of values) {
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [grocery, priority] = await Promise.all([
    getGroceryNews(),
    getPriorityBanner(),
  ]);

  const byDay = new Map<string, { grocery: number; priority: number }>();

  for (const row of grocery.rows) {
    const d = safeParseDate(row.date);
    if (!d) continue;
    const key = format(d, "yyyy-MM-dd");
    const entry = byDay.get(key) ?? { grocery: 0, priority: 0 };
    entry.grocery += 1;
    byDay.set(key, entry);
  }

  for (const row of priority.rows) {
    const d = safeParseDate(row.published);
    if (!d) continue;
    const key = format(d, "yyyy-MM-dd");
    const entry = byDay.get(key) ?? { grocery: 0, priority: 0 };
    entry.priority += 1;
    byDay.set(key, entry);
  }

  const trend: TrendPoint[] = Array.from(byDay.entries())
    .map(([date, v]) => ({ date, grocery: v.grocery, priority: v.priority }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);

  const lastSyncCandidates = [grocery.meta.lastUpdated, priority.meta.lastUpdated].filter(
    (v): v is string => Boolean(v)
  );
  const lastSync = lastSyncCandidates.length
    ? lastSyncCandidates.sort().reverse()[0]
    : null;

  const totalRecords = grocery.meta.count + priority.meta.count;
  const activeSources = grocery.meta.sources + (priority.meta.count > 0 ? 1 : 0);

  let processingStatus: DashboardSummary["processingStatus"] = "no-data";
  if (totalRecords > 0) {
    processingStatus = "idle";
    if (lastSync) {
      const hoursSince = (Date.now() - new Date(lastSync).getTime()) / 36e5;
      if (hoursSince > 48) processingStatus = "stale";
    }
  }

  return {
    totalRecords,
    groceryRecords: grocery.meta.count,
    priorityRecords: priority.meta.count,
    activeSources,
    lastSync,
    processingStatus,
    trend,
    categoryDistribution: tally(grocery.rows.map((r) => r.source)),
    priorityDistribution: tally(priority.rows.map((r) => r.event_type || "Unknown")),
  };
}
