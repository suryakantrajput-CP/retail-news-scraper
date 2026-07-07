"use client";

import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  AlertCircle,
  Clock,
  Database,
  Rss,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DashboardSummary } from "@/lib/types";

const STATUS_CONFIG: Record<
  DashboardSummary["processingStatus"],
  { label: string; className: string }
> = {
  idle: {
    label: "Idle · up to date",
    className: "bg-[var(--viz-4-green)]/10 text-[var(--viz-4-green)] border-[var(--viz-4-green)]/30",
  },
  stale: {
    label: "Stale · needs refresh",
    className: "bg-[var(--viz-3-yellow)]/10 text-[var(--viz-3-yellow)] border-[var(--viz-3-yellow)]/30",
  },
  "no-data": {
    label: "No data yet",
    className: "bg-muted text-muted-foreground",
  },
};

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  subtext?: React.ReactNode;
}

function StatCard({ icon: Icon, label, value, subtext }: StatCardProps) {
  return (
    <Card className="gap-2 py-5 shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="flex items-start justify-between px-5">
        <div className="min-w-0 space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <div className="text-2xl font-semibold tabular-nums">{value}</div>
          {subtext && (
            <p className="truncate text-xs text-muted-foreground">{subtext}</p>
          )}
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-[18px] w-[18px]" />
        </div>
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card className="gap-2 py-5 shadow-sm">
      <CardContent className="space-y-3 px-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

export function SummaryCards({
  summary,
  isLoading,
}: {
  summary?: DashboardSummary;
  isLoading?: boolean;
}) {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const status = STATUS_CONFIG[summary.processingStatus];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={Database}
        label="Total Records"
        value={summary.totalRecords.toLocaleString()}
        subtext={`${summary.groceryRecords} grocery · ${summary.priorityRecords} priority · ${summary.communityImpactRecords} community · ${summary.groceryDbNewsRecords} grocery DB`}
      />
      <StatCard
        icon={Rss}
        label="Active Sources"
        value={summary.activeSources}
        subtext="News outlets currently feeding data"
      />
      <StatCard
        icon={Clock}
        label="Latest Update"
        value={
          summary.lastSync
            ? formatDistanceToNow(new Date(summary.lastSync), { addSuffix: true })
            : "—"
        }
        subtext={
          summary.lastSync
            ? `Last sync: ${new Date(summary.lastSync).toLocaleString()}`
            : "Run the Python scripts to populate data"
        }
      />
      <Card className="gap-2 py-5 shadow-sm transition-shadow hover:shadow-md">
        <CardContent className="flex items-start justify-between px-5">
          <div className="min-w-0 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Processing Status
            </p>
            <Badge variant="outline" className={cn("gap-1.5 border px-2 py-1", status.className)}>
              {summary.processingStatus === "no-data" ? (
                <AlertCircle className="h-3 w-3" />
              ) : (
                <Activity className="h-3 w-3" />
              )}
              {status.label}
            </Badge>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Activity className="h-[18px] w-[18px]" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
