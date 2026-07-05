"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";

export function useRefreshAll() {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["grocery-news"] }),
        queryClient.invalidateQueries({ queryKey: ["priority-banner"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
      ]);
      toast.success("Data refresh complete", {
        description: "Latest files reloaded from disk.",
      });
    } catch {
      toast.error("Refresh failed", {
        description: "Could not reload data. Check the server logs.",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return { refresh, isRefreshing };
}
