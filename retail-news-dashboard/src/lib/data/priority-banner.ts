import fs from "node:fs";
import Papa from "papaparse";
import { PRIORITY_BANNER_MASTER_CSV } from "@/lib/paths";
import type { PriorityBannerRow, PriorityBannerResponse } from "@/lib/types";

interface RawRow {
  company_name?: string;
  event_type?: string;
  Title?: string;
  Link?: string;
  Published?: string;
  Summary?: string;
}

export async function getPriorityBanner(): Promise<PriorityBannerResponse> {
  if (!fs.existsSync(PRIORITY_BANNER_MASTER_CSV)) {
    return { rows: [], meta: { count: 0, lastUpdated: null, sources: 0 } };
  }

  const csvText = fs.readFileSync(PRIORITY_BANNER_MASTER_CSV, "utf-8");
  const parsed = Papa.parse<RawRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const rows: PriorityBannerRow[] = parsed.data
    .filter((r) => r.company_name)
    .map((r, i) => ({
      id: `priority-${i}`,
      company_name: r.company_name ?? "",
      event_type: r.event_type ?? "",
      title: r.Title ?? "",
      link: r.Link ?? "",
      published: r.Published || null,
      summary: r.Summary ?? "",
    }));

  const stat = fs.statSync(PRIORITY_BANNER_MASTER_CSV);
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
