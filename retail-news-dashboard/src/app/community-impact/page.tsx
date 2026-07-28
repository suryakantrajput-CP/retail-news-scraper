"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/data-table/data-table";
import { communityImpactColumns } from "@/components/data-table/columns-community-impact";
import { CommunityImpactByCity } from "@/components/dashboard/community-impact-by-city";
import { useAppData } from "@/lib/data-context";
import { countToday } from "@/lib/date-utils";

export default function CommunityImpactPage() {
  const { communityImpact } = useAppData();
  const { daily, master } = communityImpact;
  const todayCount = countToday(master.rows.map((r) => r.dateAppended));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex max-w-7xl flex-col gap-4"
    >
      <Card>
        <CardHeader>
          <CardTitle>Community Impact</CardTitle>
        </CardHeader>
        <CardContent className="flex items-baseline gap-3">
          <span className="text-4xl font-bold tabular-nums">{todayCount}</span>
          <span className="text-sm text-muted-foreground">
            articles today · {master.meta.count} total
          </span>
        </CardContent>
      </Card>

      <CommunityImpactByCity rows={master.rows} />

      <Tabs defaultValue="daily" className="gap-4">
        <TabsList>
          <TabsTrigger value="daily">
            Daily Scrape{daily.date ? ` · ${daily.date}` : ""}
          </TabsTrigger>
          <TabsTrigger value="master">Master File</TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <DataTable
            columns={communityImpactColumns}
            data={daily.rows}
            onRefresh={() => window.location.reload()}
            exportFilename={`community-impact-daily${daily.date ? `-${daily.date}` : ""}`}
            emptyTitle="No daily scrape data yet"
            emptyDescription="Run community_impact.py to scrape today's local business news, then refresh this page."
          />
        </TabsContent>

        <TabsContent value="master">
          <DataTable
            columns={communityImpactColumns}
            data={master.rows}
            onRefresh={() => window.location.reload()}
            exportFilename="community-impact-master"
            emptyTitle="No community impact articles yet"
            emptyDescription="Run community_impact.py to scrape local business news, then refresh this page."
          />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
