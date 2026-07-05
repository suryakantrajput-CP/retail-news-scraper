"use client";

import * as React from "react";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { DataProvider, type AppData } from "@/lib/data-context";

export function Providers({
  data,
  children,
}: {
  data: AppData;
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <DataProvider data={data}>
        <TooltipProvider delay={200}>
          {children}
          <Toaster richColors closeButton position="top-right" />
        </TooltipProvider>
      </DataProvider>
    </ThemeProvider>
  );
}
