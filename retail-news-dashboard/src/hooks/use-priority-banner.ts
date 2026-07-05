"use client";

import { useQuery } from "@tanstack/react-query";
import type { PriorityBannerResponse } from "@/lib/types";

async function fetchPriorityBanner(): Promise<PriorityBannerResponse> {
  const res = await fetch("/api/priority-banner", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load priority banner");
  return res.json();
}

export function usePriorityBanner() {
  return useQuery({
    queryKey: ["priority-banner"],
    queryFn: fetchPriorityBanner,
  });
}
