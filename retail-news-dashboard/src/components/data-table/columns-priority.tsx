"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { createSelectionColumn } from "@/components/data-table/selection-column";
import { colorForEventType } from "@/lib/chart-colors";
import type { PriorityBannerRow } from "@/lib/types";

function formatPublished(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export const priorityColumns: ColumnDef<PriorityBannerRow, unknown>[] = [
  createSelectionColumn<PriorityBannerRow>(),
  {
    accessorKey: "company_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Company" />
    ),
    meta: { label: "Company" },
    size: 200,
    cell: ({ row }) => (
      <span className="font-medium">{row.original.company_name}</span>
    ),
  },
  {
    accessorKey: "event_type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Event" />
    ),
    meta: { label: "Event type" },
    size: 130,
    cell: ({ row }) => {
      const type = row.original.event_type;
      return (
        <Badge
          variant="outline"
          className="h-6 gap-1.5 px-2.5 text-sm font-medium"
          style={{ borderColor: colorForEventType(type) }}
        >
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: colorForEventType(type) }}
          />
          {type || "Unknown"}
        </Badge>
      );
    },
    filterFn: (row, id, value: string[]) =>
      !value?.length || value.includes(row.getValue(id)),
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Headline" />
    ),
    meta: { label: "Headline" },
    size: 420,
    cell: ({ row }) => (
      <a
        href={row.original.link}
        target="_blank"
        rel="noopener noreferrer"
        className="line-clamp-2 whitespace-normal font-medium text-foreground hover:text-primary hover:underline"
      >
        {row.original.title}
      </a>
    ),
  },
  {
    accessorKey: "published",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Published" />
    ),
    meta: { label: "Published" },
    size: 170,
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-sm text-muted-foreground">
        {formatPublished(row.original.published)}
      </span>
    ),
    sortingFn: (a, b) => {
      const ta = a.original.published ? new Date(a.original.published).getTime() : 0;
      const tb = b.original.published ? new Date(b.original.published).getTime() : 0;
      return ta - tb;
    },
  },
  {
    accessorKey: "summary",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Summary" />
    ),
    meta: { label: "Summary" },
    size: 360,
    enableSorting: false,
    cell: ({ row }) => (
      <span className="line-clamp-2 whitespace-normal text-sm text-muted-foreground">
        {row.original.summary || "No summary"}
      </span>
    ),
  },
  {
    id: "link",
    header: "Link",
    meta: { label: "Link" },
    size: 90,
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        nativeButton={false}
        render={<a href={row.original.link} target="_blank" rel="noopener noreferrer" />}
      >
        <ExternalLink className="h-3.5 w-3.5" />
      </Button>
    ),
  },
];
