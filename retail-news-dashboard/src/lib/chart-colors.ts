// Fixed-order categorical palette (validated for CVD-safety — see dataviz skill).
// Colors are assigned by entity identity, never by sort rank, so a filtered or
// re-sorted chart never repaints a surviving category a different color.
export const VIZ_PALETTE = [
  "var(--viz-1-blue)",
  "var(--viz-2-aqua)",
  "var(--viz-3-yellow)",
  "var(--viz-4-green)",
  "var(--viz-5-violet)",
  "var(--viz-6-red)",
  "var(--viz-7-magenta)",
  "var(--viz-8-orange)",
] as const;

export const VIZ_GRID = "var(--viz-grid)";
export const VIZ_AXIS = "var(--viz-axis)";
export const VIZ_MUTED = "var(--viz-muted)";

// Fixed identity colors used across dashboard charts.
export const SERIES_COLORS = {
  grocery: VIZ_PALETTE[0], // blue
  priority: VIZ_PALETTE[7], // orange
  communityImpact: VIZ_PALETTE[4], // violet
  groceryDbNews: VIZ_PALETTE[6], // magenta
  opening: VIZ_PALETTE[0], // blue
  closing: VIZ_PALETTE[5], // red
} as const;

// Grocery source identity colors, fixed to the scraper's own site order so a
// given source always renders the same color regardless of sort/filter state.
const GROCERY_SOURCE_ORDER = [
  "chainstoreage",
  "commercialsearch",
  "grocerybusiness",
  "rebusiness_restaurant",
  "rebusiness_retail",
  "retailtouchpoints",
  "shoppingcenter",
  "supermarketnews",
];

export function colorForGrocerySource(source: string): string {
  const idx = GROCERY_SOURCE_ORDER.indexOf(source);
  return idx >= 0 ? VIZ_PALETTE[idx % VIZ_PALETTE.length] : VIZ_MUTED;
}

export function colorForEventType(eventType: string): string {
  const key = eventType.trim().toLowerCase();
  if (key === "opening") return SERIES_COLORS.opening;
  if (key === "closing") return SERIES_COLORS.closing;
  return VIZ_MUTED;
}
