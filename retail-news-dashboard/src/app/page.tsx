"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { CategoryDistributionChart } from "@/components/dashboard/category-distribution-chart";
import { PriorityDistributionChart } from "@/components/dashboard/priority-distribution-chart";
import { useAppData } from "@/lib/data-context";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const { dashboard: data } = useAppData();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <motion.div initial="hidden" animate="show" variants={fadeUp}>
        <SummaryCards summary={data} isLoading={false} />
      </motion.div>

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
              <TrendChart data={data.trend} />
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
              <PriorityDistributionChart data={data.priorityDistribution} />
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
              <CategoryDistributionChart data={data.categoryDistribution} />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
