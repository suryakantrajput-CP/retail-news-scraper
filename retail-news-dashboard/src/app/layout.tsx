import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/providers";
import { AppShell } from "@/components/layout/app-shell";
import { getDashboardSummary } from "@/lib/data/dashboard";
import { getGroceryNews } from "@/lib/data/grocery-news";
import { getPriorityBanner } from "@/lib/data/priority-banner";
import { getCommunityImpact } from "@/lib/data/community-impact";
import { getGroceryDbNews } from "@/lib/data/grocery-db-news";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Retail News Intelligence Tracker",
  description:
    "Enterprise dashboard for monitoring retail industry news and store event intelligence.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [dashboard, grocery, priority, communityImpact, groceryDbNews] = await Promise.all([
    getDashboardSummary(),
    getGroceryNews(),
    getPriorityBanner(),
    getCommunityImpact(),
    getGroceryDbNews(),
  ]);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers data={{ dashboard, grocery, priority, communityImpact, groceryDbNews }}>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
