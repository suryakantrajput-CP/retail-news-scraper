"use client";

import { useQuery } from "@tanstack/react-query";
import type { GroceryNewsResponse } from "@/lib/types";

async function fetchGroceryNews(): Promise<GroceryNewsResponse> {
  const res = await fetch("/api/grocery-news", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load grocery news");
  return res.json();
}

export function useGroceryNews() {
  return useQuery({
    queryKey: ["grocery-news"],
    queryFn: fetchGroceryNews,
  });
}
