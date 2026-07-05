import fs from "node:fs";
import { asyncBufferFromFile, parquetReadObjects } from "hyparquet";
import { GROCERY_NEWS_PARQUET } from "@/lib/paths";
import type { GroceryArticle, GroceryNewsResponse } from "@/lib/types";

export async function getGroceryNews(): Promise<GroceryNewsResponse> {
  if (!fs.existsSync(GROCERY_NEWS_PARQUET)) {
    return { rows: [], meta: { count: 0, lastUpdated: null, sources: 0 } };
  }

  const file = await asyncBufferFromFile(GROCERY_NEWS_PARQUET);
  const raw = await parquetReadObjects({ file });

  const rows: GroceryArticle[] = raw.map((r, i) => ({
    id: `grocery-${i}`,
    source: String(r.source ?? "unknown"),
    title: String(r.title ?? "Untitled"),
    date: r.date ? String(r.date) : null,
    link: String(r.link ?? ""),
    content: String(r.content ?? ""),
  }));

  const stat = fs.statSync(GROCERY_NEWS_PARQUET);
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
