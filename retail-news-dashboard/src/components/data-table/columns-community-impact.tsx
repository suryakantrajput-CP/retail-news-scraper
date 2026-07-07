"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { createSelectionColumn } from "@/components/data-table/selection-column";
import type { CommunityImpactRow } from "@/lib/types";

export const communityImpactColumns: ColumnDef<CommunityImpactRow, unknown>[] = [
  createSelectionColumn<CommunityImpactRow>(),
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
    meta: { label: "Title" },
    size: 480,
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
    accessorKey: "date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
    meta: { label: "Date" },
    size: 160,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.date ?? "—"}
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
