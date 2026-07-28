"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/data-table/data-table";
import { priorityColumns } from "@/components/data-table/columns-priority";
import { useAppData } from "@/lib/data-context";
import { countToday } from "@/lib/date-utils";

export default function PriorityBannerPage() {
  const { priority } = useAppData();
  const { daily, master } = priority;
  const todayCount = countToday(master.rows.map((r) => r.published));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex max-w-7xl flex-col gap-4"
    >
      <Card>
        <CardHeader>
          <CardTitle>Priority Banner</CardTitle>
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
        </TabsList>

        <TabsContent value="daily">
          <DataTable
            columns={priorityColumns}
            data={daily.rows}
            onRefresh={() => window.location.reload()}
            exportFilename={`priority-banner-daily${daily.date ? `-${daily.date}` : ""}`}
            emptyTitle="No daily scrape data yet"
            emptyDescription="Run priority_banner.py to fetch today's store opening/closing news, then refresh this page."
          />
        </TabsContent>

        <TabsContent value="master">
          <DataTable
            columns={priorityColumns}
            data={master.rows}
            onRefresh={() => window.location.reload()}
            exportFilename="priority-banner-master"
            emptyTitle="No priority alerts yet"
            emptyDescription="Run priority_banner.py to fetch store opening/closing news, then refresh this page."
          />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
