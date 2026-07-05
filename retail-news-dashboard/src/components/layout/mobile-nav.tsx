"use client";

import { Menu, Radar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { useUiStore } from "@/store/ui-store";

export function MobileNav() {
  const open = useUiStore((s) => s.mobileNavOpen);
  const setOpen = useUiStore((s) => s.setMobileNavOpen);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu" />
        }
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle className="flex items-center gap-2 text-left">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-brand-solid text-white">
              <Radar className="h-[18px] w-[18px]" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">Retail News</span>
              <span className="text-[11px] font-normal text-muted-foreground">
                Intelligence Tracker
              </span>
            </div>
          </SheetTitle>
        </SheetHeader>
        <div className="py-4">
          <SidebarNav onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
