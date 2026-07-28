export interface GroceryArticle {
  id: string;
  source: string;
  title: string;
  date: string | null;
  link: string;
  content: string;
}

export interface PriorityBannerRow {
  id: string;
  company_name: string;
  event_type: string;
  title: string;
  link: string;
  published: string | null;
  summary: string;
}

export interface CommunityImpactRow {
  id: string;
  city: string;
  title: string;
  link: string;
  date: string | null;
  dateAppended: string | null;
  image: string | null;
}

export interface GroceryDbNewsRow {
  id: string;
  company_name: string;
  event_type: string;
  title: string;
  link: string;
  published: string | null;
  summary: string;
}

export interface DatasetMeta {
  count: number;
  lastUpdated: string | null;
  sources: number;
}

export interface GroceryNewsDataset {
  rows: GroceryArticle[];
  meta: DatasetMeta;
}

export interface GroceryNewsResponse {
  daily: GroceryNewsDataset & { date: string | null };
  master: GroceryNewsDataset;
}

export interface PriorityBannerDataset {
  rows: PriorityBannerRow[];
  meta: DatasetMeta;
}

export interface PriorityBannerResponse {
  daily: PriorityBannerDataset & { date: string | null };
  master: PriorityBannerDataset;
}

export interface CommunityImpactResponse {
  rows: CommunityImpactRow[];
  meta: DatasetMeta;
}

export interface GroceryDbNewsDataset {
  rows: GroceryDbNewsRow[];
  meta: DatasetMeta;
}

export interface GroceryDbNewsResponse {
  daily: GroceryDbNewsDataset & { date: string | null };
  master: GroceryDbNewsDataset;
}

// A row of the manually-extracted table an analyst pastes back in after
// running the Grocery DB News articles through Claude by hand (no API key).
export interface ExtractionRow {
  id: string;
  companyname: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  country: string;
  event_type: string;
  opening: string;
  date_effective: string;
  observation_status: string;
  reason: string;
  short_description: string;
  article_link: string;
  date_published: string;
}

export interface TrendPoint {
  date: string;
  grocery: number;
  priority: number;
  communityImpact: number;
  groceryDbNews: number;
}

export interface CategoryDistributionPoint {
  name: string;
  value: number;
}

export interface DashboardSummary {
  totalRecords: number;
  groceryRecords: number;
  priorityRecords: number;
  communityImpactRecords: number;
  groceryDbNewsRecords: number;
  activeSources: number;
  lastSync: string | null;
  processingStatus: "idle" | "stale" | "no-data";
  trend: TrendPoint[];
  categoryDistribution: CategoryDistributionPoint[];
  priorityDistribution: CategoryDistributionPoint[];
  groceryDbNewsDistribution: CategoryDistributionPoint[];
}
