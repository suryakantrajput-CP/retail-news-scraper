import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import { COMMUNITY_IMPACT_DAILY_DIR, COMMUNITY_IMPACT_MASTER_CSV } from "@/lib/paths";
import type { CommunityImpactDataset, CommunityImpactResponse, CommunityImpactRow } from "@/lib/types";

interface RawRow {
  city?: string;
  title?: string;
  link?: string;
  date?: string;
  date_appended?: string;
  image?: string;
}

const EMPTY_DATASET: CommunityImpactDataset = {
  rows: [],
  meta: { count: 0, lastUpdated: null, sources: 0 },
};

function parseCsv(csvPath: string, idPrefix: string): CommunityImpactDataset {
  const csvText = fs.readFileSync(csvPath, "utf-8");
  const parsed = Papa.parse<RawRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const rows: CommunityImpactRow[] = parsed.data
    .filter((r) => r.title)
    .map((r, i) => ({
      id: `${idPrefix}-${i}`,
      city: r.city ?? "",
      title: r.title ?? "",
      link: r.link ?? "",
      date: r.date || null,
      dateAppended: r.date_appended || null,
      image: r.image || null,
    }));

  const stat = fs.statSync(csvPath);

  return {
    rows,
    meta: {
      count: rows.length,
      lastUpdated: stat.mtime.toISOString(),
      sources: rows.length > 0 ? 1 : 0,
    },
  };
}

const DAILY_FILE_RE = /^community_impact_(\d{4}-\d{2}-\d{2})\.csv$/;

function findLatestDailyFile(): { filePath: string; date: string } | null {
  if (!fs.existsSync(COMMUNITY_IMPACT_DAILY_DIR)) return null;

  let latest: { filePath: string; date: string } | null = null;
  for (const entry of fs.readdirSync(COMMUNITY_IMPACT_DAILY_DIR)) {
    const match = DAILY_FILE_RE.exec(entry);
    if (!match) continue;
    const date = match[1];
    if (!latest || date > latest.date) {
      latest = { filePath: path.join(COMMUNITY_IMPACT_DAILY_DIR, entry), date };
    }
  }
  return latest;
}

export async function getCommunityImpact(): Promise<CommunityImpactResponse> {
  const latestDaily = findLatestDailyFile();
  const daily = latestDaily
    ? { ...parseCsv(latestDaily.filePath, "community-impact-daily"), date: latestDaily.date }
    : { ...EMPTY_DATASET, date: null };

  const master = fs.existsSync(COMMUNITY_IMPACT_MASTER_CSV)
    ? parseCsv(COMMUNITY_IMPACT_MASTER_CSV, "community-impact-master")
    : EMPTY_DATASET;

  return { daily, master };
}
