import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import { PRIORITY_BANNER_DAILY_DIR, PRIORITY_BANNER_MASTER_CSV } from "@/lib/paths";
import type { PriorityBannerDataset, PriorityBannerResponse, PriorityBannerRow } from "@/lib/types";

interface RawRow {
  company_name?: string;
  event_type?: string;
  Title?: string;
  Link?: string;
  Published?: string;
  Summary?: string;
}

const EMPTY_DATASET: PriorityBannerDataset = {
  rows: [],
  meta: { count: 0, lastUpdated: null, sources: 0 },
};

function parseCsv(csvPath: string, idPrefix: string): PriorityBannerDataset {
  const csvText = fs.readFileSync(csvPath, "utf-8");
  const parsed = Papa.parse<RawRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const rows: PriorityBannerRow[] = parsed.data
    .filter((r) => r.company_name)
    .map((r, i) => ({
      id: `${idPrefix}-${i}`,
      company_name: r.company_name ?? "",
      event_type: r.event_type ?? "",
      title: r.Title ?? "",
      link: r.Link ?? "",
      published: r.Published || null,
      summary: r.Summary ?? "",
    }));

  const stat = fs.statSync(csvPath);
  const sources = new Set(rows.map((r) => r.company_name)).size;

  return {
    rows,
    meta: {
      count: rows.length,
      lastUpdated: stat.mtime.toISOString(),
      sources,
    },
  };
}

const DAILY_FILE_RE = /^banner_news_(\d{4}-\d{2}-\d{2})\.csv$/;

function findLatestDailyFile(): { filePath: string; date: string } | null {
  if (!fs.existsSync(PRIORITY_BANNER_DAILY_DIR)) return null;

  let latest: { filePath: string; date: string } | null = null;
  for (const entry of fs.readdirSync(PRIORITY_BANNER_DAILY_DIR)) {
    const match = DAILY_FILE_RE.exec(entry);
    if (!match) continue;
    const date = match[1];
    if (!latest || date > latest.date) {
      latest = { filePath: path.join(PRIORITY_BANNER_DAILY_DIR, entry), date };
    }
  }
  return latest;
}

export async function getPriorityBanner(): Promise<PriorityBannerResponse> {
  const latestDaily = findLatestDailyFile();
  const daily = latestDaily
    ? { ...parseCsv(latestDaily.filePath, "priority-daily"), date: latestDaily.date }
    : { ...EMPTY_DATASET, date: null };

  const master = fs.existsSync(PRIORITY_BANNER_MASTER_CSV)
    ? parseCsv(PRIORITY_BANNER_MASTER_CSV, "priority-master")
    : EMPTY_DATASET;

  return { daily, master };
}
