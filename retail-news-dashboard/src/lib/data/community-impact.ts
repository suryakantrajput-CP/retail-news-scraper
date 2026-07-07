import fs from "node:fs";
import Papa from "papaparse";
import { COMMUNITY_IMPACT_MASTER_CSV } from "@/lib/paths";
import type { CommunityImpactRow, CommunityImpactResponse } from "@/lib/types";

interface RawRow {
  title?: string;
  link?: string;
  date?: string;
}

export async function getCommunityImpact(): Promise<CommunityImpactResponse> {
  if (!fs.existsSync(COMMUNITY_IMPACT_MASTER_CSV)) {
    return { rows: [], meta: { count: 0, lastUpdated: null, sources: 0 } };
  }

  const csvText = fs.readFileSync(COMMUNITY_IMPACT_MASTER_CSV, "utf-8");
  const parsed = Papa.parse<RawRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const rows: CommunityImpactRow[] = parsed.data
    .filter((r) => r.title)
    .map((r, i) => ({
      id: `community-impact-${i}`,
      title: r.title ?? "",
      link: r.link ?? "",
      date: r.date || null,
    }));

  const stat = fs.statSync(COMMUNITY_IMPACT_MASTER_CSV);

  return {
    rows,
    meta: {
      count: rows.length,
      lastUpdated: stat.mtime.toISOString(),
      sources: rows.length > 0 ? 1 : 0,
    },
  };
}
