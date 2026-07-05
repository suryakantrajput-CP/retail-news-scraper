"use client";

import * as React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useUiStore } from "@/store/ui-store";

export function AppShell({ children }: { children: React.ReactNode }) {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);

  return (
    <div className="min-h-screen bg-muted/20">
      <Sidebar />
      <div
        className="flex min-h-screen flex-col transition-[margin-left] duration-200 ease-in-out md:ml-[var(--sidebar-w)]"
        style={{ "--sidebar-w": collapsed ? "72px" : "260px" } as React.CSSProperties}
      >
        <Topbar />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
