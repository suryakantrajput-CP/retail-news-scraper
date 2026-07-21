"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table/data-table";
import { communityImpactColumns } from "@/components/data-table/columns-community-impact";
import { CommunityImpactByCity } from "@/components/dashboard/community-impact-by-city";
import { useAppData } from "@/lib/data-context";
import { countToday } from "@/lib/date-utils";

export default function CommunityImpactPage() {
  const { communityImpact: data } = useAppData();
  const todayCount = countToday(data.rows.map((r) => r.dateAppended));

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
            articles today · {data.meta.count} total
          </span>
        </CardContent>
      </Card>

      <CommunityImpactByCity rows={data.rows} />

      <DataTable
        columns={communityImpactColumns}
        data={data.rows}
        onRefresh={() => window.location.reload()}
        exportFilename="community-impact"
        emptyTitle="No community impact articles yet"
        emptyDescription="Run community_impact.py to scrape local business news, then refresh this page."
      />
    </motion.div>
  );
}
