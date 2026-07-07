"use client";

import { motion } from "framer-motion";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table/data-table";
import { communityImpactColumns } from "@/components/data-table/columns-community-impact";
import { useAppData } from "@/lib/data-context";

export default function CommunityImpactPage() {
  const { communityImpact: data } = useAppData();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex max-w-7xl flex-col gap-4"
    >
      <Card>
        <CardHeader>
          <CardTitle>Community Impact</CardTitle>
          <CardDescription>
            {data.meta.count} local business articles · sourced from{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">community_impact.py</code>
          </CardDescription>
        </CardHeader>
      </Card>

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
