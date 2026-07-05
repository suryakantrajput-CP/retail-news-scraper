import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TableDensity = "compact" | "comfortable" | "spacious";

interface UiState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;

  density: TableDensity;
  setDensity: (density: TableDensity) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      mobileNavOpen: false,
      setMobileNavOpen: (open) => set({ mobileNavOpen: open }),

      density: "comfortable",
      setDensity: (density) => set({ density }),
    }),
    {
      name: "retail-news-ui",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        density: state.density,
      }),
    }
  )
);
