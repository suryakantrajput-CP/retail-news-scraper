"use client";

import { motion } from "framer-motion";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table/data-table";
import { priorityColumns } from "@/components/data-table/columns-priority";
import { usePriorityBanner } from "@/hooks/use-priority-banner";

export default function PriorityBannerPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = usePriorityBanner();

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
            {data?.meta.count ?? 0} store opening &amp; closing alerts across{" "}
            {data?.meta.sources ?? 0} companies · sourced from{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">priority_banner.py</code>
          </CardDescription>
        </CardHeader>
      </Card>

      <DataTable
        columns={priorityColumns}
        data={data?.rows ?? []}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error instanceof Error ? error.message : undefined}
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
        exportFilename="priority-banner"
        emptyTitle="No priority alerts yet"
        emptyDescription="Run priority_banner.py to fetch store opening/closing news, then refresh this page."
      />
    </motion.div>
  );
}
