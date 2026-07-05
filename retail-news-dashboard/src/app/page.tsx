"use client";

import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { CategoryDistributionChart } from "@/components/dashboard/category-distribution-chart";
import { PriorityDistributionChart } from "@/components/dashboard/priority-distribution-chart";
import { useDashboard } from "@/hooks/use-dashboard";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const { data, isLoading, isError, refetch, isRefetching } = useDashboard();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <motion.div initial="hidden" animate="show" variants={fadeUp}>
        <SummaryCards summary={data} isLoading={isLoading} />
      </motion.div>

      {isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <p className="font-medium">Couldn&apos;t load dashboard data</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Check that the API routes can reach the Python script output files.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Try again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ delay: 0.05 }}
            className="lg:col-span-2"
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle>News trend</CardTitle>
                <CardDescription>
                  Article volume by day across both data sources
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading || isRefetching ? (
                  <div className="h-64 animate-pulse rounded-lg bg-muted" />
                ) : (
                  <TrendChart data={data?.trend ?? []} />
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ delay: 0.1 }}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Priority distribution</CardTitle>
                <CardDescription>Opening vs. closing events</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-40 animate-pulse rounded-lg bg-muted" />
                ) : (
                  <PriorityDistributionChart data={data?.priorityDistribution ?? []} />
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ delay: 0.15 }}
            className="lg:col-span-3"
          >
            <Card>
              <CardHeader>
                <CardTitle>Category distribution</CardTitle>
                <CardDescription>
                  Grocery News articles by source outlet
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-64 animate-pulse rounded-lg bg-muted" />
                ) : (
                  <CategoryDistributionChart data={data?.categoryDistribution ?? []} />
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}
