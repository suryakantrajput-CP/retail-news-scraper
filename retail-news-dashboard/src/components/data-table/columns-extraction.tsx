"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { createSelectionColumn } from "@/components/data-table/selection-column";
import { colorForEventType } from "@/lib/chart-colors";
import type { ExtractionRow } from "@/lib/types";

export const extractionColumns: ColumnDef<ExtractionRow, unknown>[] = [
  createSelectionColumn<ExtractionRow>(),
  {
    accessorKey: "companyname",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Company" />,
    meta: { label: "Company" },
    size: 180,
    cell: ({ row }) => <span className="font-medium">{row.original.companyname}</span>,
  },
  {
    accessorKey: "event_type",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Event" />,
    meta: { label: "Event type" },
    size: 120,
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
    filterFn: (row, id, value: string[]) => !value?.length || value.includes(row.getValue(id)),
  },
  {
    accessorKey: "address",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Address" />,
    meta: { label: "Address" },
    size: 200,
  },
  {
    accessorKey: "city",
    header: ({ column }) => <DataTableColumnHeader column={column} title="City" />,
    meta: { label: "City" },
    size: 130,
  },
  {
    accessorKey: "state",
    header: ({ column }) => <DataTableColumnHeader column={column} title="State" />,
    meta: { label: "State" },
    size: 90,
  },
  {
    accessorKey: "zipcode",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Zip" />,
    meta: { label: "Zip code" },
    size: 90,
  },
  {
    accessorKey: "country",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Country" />,
    meta: { label: "Country" },
    size: 90,
  },
  {
    accessorKey: "date_effective",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date Effective" />,
    meta: { label: "Date effective" },
    size: 150,
  },
  {
    accessorKey: "observation_status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Observation" />,
    meta: { label: "Observation status" },
    size: 220,
  },
  {
    accessorKey: "reason",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Reason" />,
    meta: { label: "Reason" },
    size: 160,
  },
  {
    accessorKey: "short_description",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Summary" />,
    meta: { label: "Short description" },
    size: 360,
    enableSorting: false,
    cell: ({ row }) => (
      <span className="line-clamp-2 whitespace-normal text-sm text-muted-foreground">
        {row.original.short_description || "—"}
      </span>
    ),
  },
  {
    accessorKey: "date_published",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Published" />,
    meta: { label: "Date published" },
    size: 150,
  },
  {
    id: "link",
    header: "Link",
    meta: { label: "Link" },
    size: 90,
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) =>
      row.original.article_link ? (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          nativeButton={false}
          render={<a href={row.original.article_link} target="_blank" rel="noopener noreferrer" />}
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      ) : null,
  },
];
