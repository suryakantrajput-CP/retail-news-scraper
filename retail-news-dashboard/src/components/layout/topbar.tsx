"use client";

import { usePathname } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/mobile-nav";
import { GlobalSearch } from "@/components/layout/global-search";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Notifications } from "@/components/layout/notifications";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import { useRefreshAll } from "@/hooks/use-refresh-all";
import { cn } from "@/lib/utils";

export function Topbar() {
  const pathname = usePathname();
  const { refresh, isRefreshing } = useRefreshAll();
  const current = NAV_ITEMS.find((item) => item.href === pathname);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <MobileNav />

      <div className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-sm font-semibold sm:text-base">
          {current?.title ?? "Retail News Intelligence Tracker"}
        </span>
        <span className="hidden truncate text-xs text-muted-foreground sm:block">
          {current?.description ?? "Overview & key metrics"}
        </span>
      </div>

      <div className="mx-1 flex flex-1 justify-end sm:mx-2 sm:justify-center">
        <GlobalSearch />
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          <span className="hidden sm:inline">Refresh Data</span>
        </Button>
        <Notifications />
        <ThemeToggle />
      </div>
    </header>
  );
}
