import fs from "node:fs";
import path from "node:path";
import { asyncBufferFromFile, parquetReadObjects } from "hyparquet";
import { GROCERY_NEWS_DAILY_DIR, GROCERY_NEWS_MASTER_PARQUET } from "@/lib/paths";
import type { GroceryArticle, GroceryNewsDataset, GroceryNewsResponse } from "@/lib/types";

const EMPTY_DATASET: GroceryNewsDataset = {
  rows: [],
  meta: { count: 0, lastUpdated: null, sources: 0 },
};

async function parseParquet(filePath: string, idPrefix: string): Promise<GroceryNewsDataset> {
  const file = await asyncBufferFromFile(filePath);
  const raw = await parquetReadObjects({ file });

  const rows: GroceryArticle[] = raw.map((r, i) => ({
    id: `${idPrefix}-${i}`,
    source: String(r.source ?? "unknown"),
    title: String(r.title ?? "Untitled"),
    date: r.date ? String(r.date) : null,
    link: String(r.link ?? ""),
    content: String(r.content ?? ""),
  }));

  const stat = fs.statSync(filePath);
  const sources = new Set(rows.map((r) => r.source)).size;

  return {
    rows,
    meta: {
      count: rows.length,
      lastUpdated: stat.mtime.toISOString(),
      sources,
    },
  };
}

const DAILY_FILE_RE = /^grocery_news_(\d{4}-\d{2}-\d{2})\.parquet$/;

function findLatestDailyFile(): { filePath: string; date: string } | null {
  if (!fs.existsSync(GROCERY_NEWS_DAILY_DIR)) return null;

  let latest: { filePath: string; date: string } | null = null;
  for (const entry of fs.readdirSync(GROCERY_NEWS_DAILY_DIR)) {
    const match = DAILY_FILE_RE.exec(entry);
    if (!match) continue;
    const date = match[1];
    if (!latest || date > latest.date) {
      latest = { filePath: path.join(GROCERY_NEWS_DAILY_DIR, entry), date };
    }
  }
  return latest;
}

export async function getGroceryNews(): Promise<GroceryNewsResponse> {
  const latestDaily = findLatestDailyFile();
  const daily = latestDaily
    ? { ...(await parseParquet(latestDaily.filePath, "grocery-daily")), date: latestDaily.date }
    : { ...EMPTY_DATASET, date: null };

  const master = fs.existsSync(GROCERY_NEWS_MASTER_PARQUET)
    ? await parseParquet(GROCERY_NEWS_MASTER_PARQUET, "grocery-master")
    : EMPTY_DATASET;

  return { daily, master };
}
