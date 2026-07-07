"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table/data-table";
import { groceryDbNewsColumns } from "@/components/data-table/columns-grocery-db-news";
import { useAppData } from "@/lib/data-context";
import { countToday } from "@/lib/date-utils";

export default function GroceryDbNewsPage() {
  const { groceryDbNews: data } = useAppData();
  const todayCount = countToday(data.rows.map((r) => r.published));

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
            alerts today · {data.meta.count} total across {data.meta.sources} companies
          </span>
        </CardContent>
      </Card>

      <DataTable
        columns={groceryDbNewsColumns}
        data={data.rows}
        onRefresh={() => window.location.reload()}
        exportFilename="grocery-db-news"
        emptyTitle="No grocery DB news yet"
        emptyDescription="Run grocery_db_news.py to fetch opening/closing news for the grocery company list, then refresh this page."
      />
    </motion.div>
  );
}
