"use client";

import { motion } from "framer-motion";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table/data-table";
import { priorityColumns } from "@/components/data-table/columns-priority";
import { useAppData } from "@/lib/data-context";

export default function PriorityBannerPage() {
  const { priority: data } = useAppData();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex max-w-7xl flex-col gap-4"
    >
      <Card>
        <CardHeader>
          <CardTitle>Priority Banner</CardTitle>
          <CardDescription>
            {data.meta.count} store opening &amp; closing alerts across{" "}
            {data.meta.sources} companies · sourced from{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">priority_banner.py</code>
          </CardDescription>
        </CardHeader>
      </Card>

      <DataTable
        columns={priorityColumns}
        data={data.rows}
        onRefresh={() => window.location.reload()}
        exportFilename="priority-banner"
        emptyTitle="No priority alerts yet"
        emptyDescription="Run priority_banner.py to fetch store opening/closing news, then refresh this page."
      />
    </motion.div>
  );
}
