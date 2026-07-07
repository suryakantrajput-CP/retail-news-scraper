"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table/data-table";
import { groceryColumns } from "@/components/data-table/columns-grocery";
import { useAppData } from "@/lib/data-context";
import { countToday } from "@/lib/date-utils";

export default function GroceryNewsPage() {
  const { grocery: data } = useAppData();
  const todayCount = countToday(data.rows.map((r) => r.date));

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
            articles today · {data.meta.count} total from {data.meta.sources} outlets
          </span>
        </CardContent>
      </Card>

      <DataTable
        columns={groceryColumns}
        data={data.rows}
        onRefresh={() => window.location.reload()}
        exportFilename="grocery-news"
        emptyTitle="No grocery news yet"
        emptyDescription="Run grocery_news.py to scrape retail trade outlets, then refresh this page."
      />
    </motion.div>
  );
}
