"use client";

import * as React from "react";
import type {
  CommunityImpactResponse,
  DashboardSummary,
  GroceryNewsResponse,
  PriorityBannerResponse,
} from "@/lib/types";

export type AppData = {
  dashboard: DashboardSummary;
  grocery: GroceryNewsResponse;
  priority: PriorityBannerResponse;
  communityImpact: CommunityImpactResponse;
};

const DataContext = React.createContext<AppData | null>(null);

export function DataProvider({
  data,
  children,
}: {
  data: AppData;
  children: React.ReactNode;
}) {
  return <DataContext.Provider value={data}>{children}</DataContext.Provider>;
}

export function useAppData() {
  const ctx = React.useContext(DataContext);
  if (!ctx) throw new Error("useAppData must be used within DataProvider");
  return ctx;
}
