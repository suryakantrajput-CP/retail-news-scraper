"use client";

import { motion } from "framer-motion";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table/data-table";
import { groceryColumns } from "@/components/data-table/columns-grocery";
import { useAppData } from "@/lib/data-context";

export default function GroceryNewsPage() {
  const { grocery: data } = useAppData();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex max-w-7xl flex-col gap-4"
    >
      <Card>
        <CardHeader>
          <CardTitle>Grocery News</CardTitle>
          <CardDescription>
            {data.meta.count} articles scraped from {data.meta.sources}{" "}
            retail &amp; grocery trade outlets · sourced from{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">grocery_news.py</code>
            {" "}· full article text is included in CSV exports, not shown in the table
          </CardDescription>
        </CardHeader>
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
