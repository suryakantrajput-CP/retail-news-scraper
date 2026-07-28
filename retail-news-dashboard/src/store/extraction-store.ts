import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ExtractionRow } from "@/lib/types";

function dedupeKey(row: ExtractionRow): string {
  return `${row.companyname.trim().toLowerCase()}|${row.article_link.trim().toLowerCase()}`;
}

interface ExtractionState {
  rows: ExtractionRow[];
  addRows: (rows: ExtractionRow[]) => number;
  removeRow: (id: string) => void;
  clearRows: () => void;
}

export const useExtractionStore = create<ExtractionState>()(
  persist(
    (set, get) => ({
      rows: [],
      addRows: (newRows) => {
        const existingKeys = new Set(get().rows.map(dedupeKey));
        const deduped = newRows.filter((row) => {
          const key = dedupeKey(row);
          if (existingKeys.has(key)) return false;
          existingKeys.add(key);
          return true;
        });
        if (deduped.length > 0) {
          set((state) => ({ rows: [...deduped, ...state.rows] }));
        }
        return deduped.length;
      },
      removeRow: (id) => set((state) => ({ rows: state.rows.filter((r) => r.id !== id) })),
      clearRows: () => set({ rows: [] }),
    }),
    { name: "grocery-db-news-extraction" }
  )
);
