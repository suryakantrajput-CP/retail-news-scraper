import path from "node:path";

// The Python scripts live one directory above this Next.js project and write
// their output files there — this app reads those files directly rather than
// re-implementing the scraping logic. The GitHub Pages build always checks
// out the full monorepo, so this path is available at build time.
export const DATA_ROOT = path.join(process.cwd(), "..");

export const GROCERY_NEWS_MASTER_PARQUET = path.join(
  DATA_ROOT,
  "master_file",
  "grocery_news_master.parquet"
);

export const GROCERY_NEWS_DAILY_DIR = path.join(DATA_ROOT, "data", "grocery_news");

export const PRIORITY_BANNER_MASTER_CSV = path.join(
  DATA_ROOT,
  "master_file",
  "banner_news_master.csv"
);

export const PRIORITY_BANNER_DAILY_DIR = path.join(DATA_ROOT, "data", "store_news");

export const COMMUNITY_IMPACT_MASTER_CSV = path.join(
  DATA_ROOT,
  "master_file",
  "community_impact_master.csv"
);

export const GROCERY_DB_NEWS_MASTER_CSV = path.join(
  DATA_ROOT,
  "master_file",
  "grocery_db_news_master.csv"
);

export const GROCERY_DB_NEWS_DAILY_DIR = path.join(
  DATA_ROOT,
  "data",
  "grocery_db_news"
);
