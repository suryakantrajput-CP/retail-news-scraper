"use client";

import { useQuery } from "@tanstack/react-query";
import type { DashboardSummary } from "@/lib/types";

async function fetchDashboard(): Promise<DashboardSummary> {
  const res = await fetch("/api/dashboard", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load dashboard summary");
  return res.json();
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: fetchDashboard,
  });
}
