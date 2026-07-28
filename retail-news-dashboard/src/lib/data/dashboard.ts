import { format } from "date-fns";
import { getGroceryNews } from "@/lib/data/grocery-news";
import { getPriorityBanner } from "@/lib/data/priority-banner";
import { getCommunityImpact } from "@/lib/data/community-impact";
import { getGroceryDbNews } from "@/lib/data/grocery-db-news";
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
  const [grocery, priority, communityImpact, groceryDbNews] = await Promise.all([
    getGroceryNews(),
    getPriorityBanner(),
    getCommunityImpact(),
    getGroceryDbNews(),
  ]);

  const byDay = new Map<
    string,
    { grocery: number; priority: number; communityImpact: number; groceryDbNews: number }
  >();

  function bump(
    key: string,
    field: "grocery" | "priority" | "communityImpact" | "groceryDbNews"
  ) {
    const entry =
      byDay.get(key) ?? { grocery: 0, priority: 0, communityImpact: 0, groceryDbNews: 0 };
    entry[field] += 1;
    byDay.set(key, entry);
  }

  for (const row of grocery.master.rows) {
    const d = safeParseDate(row.date);
    if (!d) continue;
    bump(format(d, "yyyy-MM-dd"), "grocery");
  }

  for (const row of priority.master.rows) {
    const d = safeParseDate(row.published);
    if (!d) continue;
    bump(format(d, "yyyy-MM-dd"), "priority");
  }

  for (const row of communityImpact.master.rows) {
    // `date` is relative text ("16h ago") straight from the source page and
    // can't be parsed into a real date — `dateAppended` (the scrape date) is
    // the only reliable timestamp available for this dataset.
    const d = safeParseDate(row.dateAppended);
    if (!d) continue;
    bump(format(d, "yyyy-MM-dd"), "communityImpact");
  }

  for (const row of groceryDbNews.master.rows) {
    const d = safeParseDate(row.published);
    if (!d) continue;
    bump(format(d, "yyyy-MM-dd"), "groceryDbNews");
  }

  const trend: TrendPoint[] = Array.from(byDay.entries())
    .map(([date, v]) => ({
      date,
      grocery: v.grocery,
      priority: v.priority,
      communityImpact: v.communityImpact,
      groceryDbNews: v.groceryDbNews,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);

  const lastSyncCandidates = [
    grocery.master.meta.lastUpdated,
    priority.master.meta.lastUpdated,
    communityImpact.master.meta.lastUpdated,
    groceryDbNews.master.meta.lastUpdated,
  ].filter((v): v is string => Boolean(v));
  const lastSync = lastSyncCandidates.length
    ? lastSyncCandidates.sort().reverse()[0]
    : null;

  const totalRecords =
    grocery.master.meta.count +
    priority.master.meta.count +
    communityImpact.master.meta.count +
    groceryDbNews.master.meta.count;
  const activeSources =
    grocery.master.meta.sources +
    (priority.master.meta.count > 0 ? 1 : 0) +
    (communityImpact.master.meta.count > 0 ? 1 : 0) +
    (groceryDbNews.master.meta.count > 0 ? 1 : 0);

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
    groceryRecords: grocery.master.meta.count,
    priorityRecords: priority.master.meta.count,
    communityImpactRecords: communityImpact.master.meta.count,
    groceryDbNewsRecords: groceryDbNews.master.meta.count,
    activeSources,
    lastSync,
    processingStatus,
    trend,
    categoryDistribution: tally(grocery.master.rows.map((r) => r.source)),
    priorityDistribution: tally(priority.master.rows.map((r) => r.event_type || "Unknown")),
    groceryDbNewsDistribution: tally(
      groceryDbNews.master.rows.map((r) => r.event_type || "Unknown")
    ),
  };
}
