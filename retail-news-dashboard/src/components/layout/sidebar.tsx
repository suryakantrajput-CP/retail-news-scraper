"use client";

import { motion } from "framer-motion";
import { ChevronsLeft, ChevronsRight, Radar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { useUiStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="fixed inset-y-0 left-0 z-40 hidden flex-col border-r bg-sidebar/95 backdrop-blur-sm md:flex"
    >
      <div
        className={cn(
          "flex h-16 items-center gap-2 border-b px-4",
          collapsed && "justify-center px-2"
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-brand-solid text-white shadow-sm">
          <Radar className="h-[18px] w-[18px]" />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">Retail News</span>
            <span className="text-[11px] text-muted-foreground">
              Intelligence Tracker
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <SidebarNav collapsed={collapsed} />
      </div>

      <div className="border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="w-full justify-center gap-2 text-muted-foreground"
        >
          {collapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronsLeft className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </motion.aside>
  );
}
