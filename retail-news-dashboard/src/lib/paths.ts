import fs from "node:fs";
import path from "node:path";

// The Python scripts live one directory above this Next.js project and write
// their output files there — this app reads those files directly rather than
// re-implementing the scraping logic. When deployed standalone (e.g. Vercel),
// the parent directory isn't available, so a `data-snapshot` copy bundled
// inside this project is used instead (see next.config.ts outputFileTracingIncludes).
const MONOREPO_ROOT = path.join(process.cwd(), "..");
const SNAPSHOT_ROOT = path.join(process.cwd(), "data-snapshot");

export const DATA_ROOT = fs.existsSync(path.join(MONOREPO_ROOT, "all_articles.parquet"))
  ? MONOREPO_ROOT
  : SNAPSHOT_ROOT;

export const GROCERY_NEWS_PARQUET = path.join(DATA_ROOT, "all_articles.parquet");

export const PRIORITY_BANNER_MASTER_CSV = path.join(
  DATA_ROOT,
  "master_file",
  "banner_news_master.csv"
);
