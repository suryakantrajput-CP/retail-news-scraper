"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/data-table/data-table";
import { groceryDbNewsColumns } from "@/components/data-table/columns-grocery-db-news";
import { ExtractionPanel } from "@/components/grocery-db-news/extraction-panel";
import { useAppData } from "@/lib/data-context";
import { countToday } from "@/lib/date-utils";

export default function GroceryDbNewsPage() {
  const { groceryDbNews } = useAppData();
  const { daily, master } = groceryDbNews;
  const todayCount = countToday(master.rows.map((r) => r.published));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex max-w-7xl flex-col gap-4"
    >
      <Card>
        <CardHeader>
          <CardTitle>Grocery DB News</CardTitle>
        </CardHeader>
        <CardContent className="flex items-baseline gap-3">
          <span className="text-4xl font-bold tabular-nums">{todayCount}</span>
          <span className="text-sm text-muted-foreground">
            alerts today · {master.meta.count} total across {master.meta.sources} companies
          </span>
        </CardContent>
      </Card>

      <Tabs defaultValue="daily" className="gap-4">
        <TabsList>
          <TabsTrigger value="daily">
            Daily Scrape{daily.date ? ` · ${daily.date}` : ""}
          </TabsTrigger>
          <TabsTrigger value="master">Master File</TabsTrigger>
          <TabsTrigger value="extraction">Extraction</TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <DataTable
            columns={groceryDbNewsColumns}
            data={daily.rows}
            onRefresh={() => window.location.reload()}
            exportFilename={`grocery-db-news-daily${daily.date ? `-${daily.date}` : ""}`}
            emptyTitle="No daily scrape data yet"
            emptyDescription="Run grocery_db_news.py to fetch today's opening/closing news, then refresh this page."
          />
        </TabsContent>

        <TabsContent value="master">
          <DataTable
            columns={groceryDbNewsColumns}
            data={master.rows}
            onRefresh={() => window.location.reload()}
            exportFilename="grocery-db-news-master"
            emptyTitle="No grocery DB news yet"
            emptyDescription="Run grocery_db_news.py to fetch opening/closing news for the grocery company list, then refresh this page."
          />
        </TabsContent>

        <TabsContent value="extraction">
          <ExtractionPanel dailyRows={daily.rows} dailyDate={daily.date} />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
