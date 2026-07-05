"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { createSelectionColumn } from "@/components/data-table/selection-column";
import { colorForGrocerySource } from "@/lib/chart-colors";
import type { GroceryArticle } from "@/lib/types";

function sourceLabel(source: string) {
  return source
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export const groceryColumns: ColumnDef<GroceryArticle, unknown>[] = [
  createSelectionColumn<GroceryArticle>(),
  {
    accessorKey: "source",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Source" />
    ),
    meta: { label: "Source" },
    size: 170,
    cell: ({ row }) => {
      const source = row.original.source;
      return (
        <Badge
          variant="outline"
          className="h-6 gap-1.5 px-2.5 text-sm font-medium"
          style={{ borderColor: colorForGrocerySource(source) }}
        >
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: colorForGrocerySource(source) }}
          />
          {sourceLabel(source)}
        </Badge>
      );
    },
    filterFn: (row, id, value: string[]) =>
      !value?.length || value.includes(row.getValue(id)),
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
    meta: { label: "Title" },
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
    accessorKey: "date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
    meta: { label: "Date" },
    size: 140,
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
