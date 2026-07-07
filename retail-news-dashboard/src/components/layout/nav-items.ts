import { LayoutDashboard, ShoppingCart, Megaphone, Building2, Store, type LucideIcon } from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    description: "Overview & key metrics",
  },
  {
    title: "Grocery News",
    href: "/grocery-news",
    icon: ShoppingCart,
    description: "Retail & grocery industry news",
  },
  {
    title: "Priority Banner",
    href: "/priority-banner",
    icon: Megaphone,
    description: "Store opening & closing alerts",
  },
  {
    title: "Community Impact",
    href: "/community-impact",
    icon: Building2,
    description: "Local business news",
  },
  {
    title: "Grocery DB News",
    href: "/grocery-db-news",
    icon: Store,
    description: "Opening & closing alerts for the grocery company database",
  },
];
