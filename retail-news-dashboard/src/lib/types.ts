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
  title: string;
  link: string;
  date: string | null;
  dateAppended: string | null;
}

export interface DatasetMeta {
  count: number;
  lastUpdated: string | null;
  sources: number;
}

export interface GroceryNewsResponse {
  rows: GroceryArticle[];
  meta: DatasetMeta;
}

export interface PriorityBannerResponse {
  rows: PriorityBannerRow[];
  meta: DatasetMeta;
}

export interface CommunityImpactResponse {
  rows: CommunityImpactRow[];
  meta: DatasetMeta;
}

export interface TrendPoint {
  date: string;
  grocery: number;
  priority: number;
  communityImpact: number;
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
  activeSources: number;
  lastSync: string | null;
  processingStatus: "idle" | "stale" | "no-data";
  trend: TrendPoint[];
  categoryDistribution: CategoryDistributionPoint[];
  priorityDistribution: CategoryDistributionPoint[];
}
