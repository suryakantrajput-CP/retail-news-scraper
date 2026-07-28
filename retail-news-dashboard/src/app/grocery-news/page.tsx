"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/data-table/data-table";
import { groceryColumns } from "@/components/data-table/columns-grocery";
import { useAppData } from "@/lib/data-context";
import { countToday } from "@/lib/date-utils";

export default function GroceryNewsPage() {
  const { grocery } = useAppData();
  const { daily, master } = grocery;
  const todayCount = countToday(master.rows.map((r) => r.date));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex max-w-7xl flex-col gap-4"
    >
      <Card>
        <CardHeader>
          <CardTitle>Grocery News</CardTitle>
        </CardHeader>
        <CardContent className="flex items-baseline gap-3">
          <span className="text-4xl font-bold tabular-nums">{todayCount}</span>
          <span className="text-sm text-muted-foreground">
            articles today · {master.meta.count} total from {master.meta.sources} outlets
          </span>
        </CardContent>
      </Card>

      <Tabs defaultValue="daily" className="gap-4">
        <TabsList>
          <TabsTrigger value="daily">
            Daily Scrape{daily.date ? ` · ${daily.date}` : ""}
          </TabsTrigger>
          <TabsTrigger value="master">Master File</TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <DataTable
            columns={groceryColumns}
            data={daily.rows}
            onRefresh={() => window.location.reload()}
            exportFilename={`grocery-news-daily${daily.date ? `-${daily.date}` : ""}`}
            emptyTitle="No daily scrape data yet"
            emptyDescription="Run grocery_news.py to scrape today's retail trade outlets, then refresh this page."
          />
        </TabsContent>

        <TabsContent value="master">
          <DataTable
            columns={groceryColumns}
            data={master.rows}
            onRefresh={() => window.location.reload()}
            exportFilename="grocery-news-master"
            emptyTitle="No grocery news yet"
            emptyDescription="Run grocery_news.py to scrape retail trade outlets, then refresh this page."
          />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
