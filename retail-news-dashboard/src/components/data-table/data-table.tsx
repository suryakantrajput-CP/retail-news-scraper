"use client";

import * as React from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnOrderState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { toast } from "sonner";
import { GripVertical, Inbox, AlertTriangle } from "lucide-react";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { exportRowsToCsv } from "@/lib/export-csv";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import type { TableDensity } from "@/store/ui-store";
import { useUiStore } from "@/store/ui-store";

const DENSITY_ROW_HEIGHT: Record<TableDensity, number> = {
  compact: 34,
  comfortable: 44,
  spacious: 58,
};

const DENSITY_CELL_PADDING: Record<TableDensity, string> = {
  compact: "py-1.5",
  comfortable: "py-2.5",
  spacious: "py-4",
};

interface DataTableProps<TData extends { id: string }, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRefresh: () => void;
  isRefreshing?: boolean;
  exportFilename: string;
  emptyTitle?: string;
  emptyDescription?: string;
  initialColumnVisibility?: VisibilityState;
}

function globalFilterFn<TData>(row: { original: TData }, term: string) {
  const haystack = Object.values(row.original as Record<string, unknown>)
    .filter((v) => typeof v === "string" || typeof v === "number")
    .join(" ")
    .toLowerCase();
  return haystack.includes(term.toLowerCase());
}

export function DataTable<TData extends { id: string }, TValue>({
  columns,
  data,
  isLoading,
  isError,
  errorMessage,
  onRefresh,
  isRefreshing,
  exportFilename,
  emptyTitle = "No records found",
  emptyDescription = "There is no data to display yet.",
  initialColumnVisibility,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
    initialColumnVisibility ?? {}
  );
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const density = useUiStore((s) => s.density);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      columnOrder,
      rowSelection,
      globalFilter,
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    columnResizeMode: "onChange",
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    initialState: { pagination: { pageSize: 25 } },
  });

  const rows = table.getRowModel().rows;

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const rowHeight = DENSITY_ROW_HEIGHT[density];
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: 12,
  });
  const virtualRows = virtualizer.getVirtualItems();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? virtualizer.getTotalSize() - virtualRows[virtualRows.length - 1].end
      : 0;

  function handleExportAll() {
    if (data.length === 0) {
      toast.warning("Nothing to export", { description: "This table has no rows." });
      return;
    }
    exportRowsToCsv(
      data as unknown as Record<string, unknown>[],
      exportFilename
    );
    toast.success("CSV export complete", {
      description: `${data.length} row(s) exported to ${exportFilename}.csv`,
    });
  }

  function handleExportSelected() {
    const selected = table
      .getFilteredSelectedRowModel()
      .rows.map((r) => r.original as unknown as Record<string, unknown>);
    if (selected.length === 0) {
      toast.warning("No rows selected");
      return;
    }
    exportRowsToCsv(selected, `${exportFilename}-selected`);
    toast.success("CSV export complete", {
      description: `${selected.length} selected row(s) exported.`,
    });
  }

  function handleCopyCell(value: unknown) {
    const text = String(value ?? "");
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Copied to clipboard");
    });
  }

  // Column drag-to-reorder
  const dragColId = React.useRef<string | null>(null);
  function onHeaderDragStart(id: string) {
    dragColId.current = id;
  }
  function onHeaderDrop(targetId: string) {
    const sourceId = dragColId.current;
    dragColId.current = null;
    if (!sourceId || sourceId === targetId) return;

    const currentOrder =
      columnOrder.length > 0
        ? columnOrder
        : table.getAllLeafColumns().map((c) => c.id);
    const next = [...currentOrder];
    const from = next.indexOf(sourceId);
    const to = next.indexOf(targetId);
    if (from === -1 || to === -1) return;
    next.splice(from, 1);
    next.splice(to, 0, sourceId);
    setColumnOrder(next);
  }

  const containerClass = isFullscreen
    ? "fixed inset-0 z-50 flex flex-col bg-background"
    : "flex flex-col rounded-xl border bg-card shadow-sm";

  return (
    <div className={containerClass}>
      <DataTableToolbar
        table={table}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
        onExportAll={handleExportAll}
        onExportSelected={handleExportSelected}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen((v) => !v)}
      />

      {isError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-16 text-center">
          <AlertTriangle className="h-10 w-10 text-destructive" />
          <p className="font-medium">Couldn&apos;t load data</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {errorMessage ?? "Something went wrong while loading this table."}
          </p>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            Try again
          </Button>
        </div>
      ) : isLoading ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-16 text-center">
          <Inbox className="h-10 w-10 text-muted-foreground" />
          <p className="font-medium">{emptyTitle}</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {emptyDescription}
          </p>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className={cn(
            "relative overflow-auto",
            isFullscreen ? "flex-1" : "h-[600px]"
          )}
        >
          <table
            className="caption-bottom text-base"
            style={{ width: "100%", minWidth: table.getTotalSize() }}
          >
            <TableHeader className="sticky top-0 z-20 bg-card shadow-[0_1px_0_0_var(--border)]">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header, idx) => (
                    <TableHead
                      key={header.id}
                      draggable={!header.isPlaceholder && idx > 0}
                      onDragStart={() => onHeaderDragStart(header.column.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => onHeaderDrop(header.column.id)}
                      style={{ width: header.getSize(), position: "relative" }}
                      className={cn(
                        "select-none bg-card",
                        idx === 0 && "sticky left-0 z-30 bg-card"
                      )}
                    >
                      <div className="flex items-center gap-1">
                        {idx > 0 && (
                          <GripVertical className="h-3 w-3 shrink-0 cursor-grab text-muted-foreground/50" />
                        )}
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </div>
                      {header.column.getCanResize() && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className={cn(
                            "absolute right-0 top-0 h-full w-1.5 cursor-col-resize touch-none select-none bg-transparent hover:bg-primary/40",
                            header.column.getIsResizing() && "bg-primary"
                          )}
                        />
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {paddingTop > 0 && (
                <tr>
                  <td style={{ height: paddingTop }} colSpan={columns.length} />
                </tr>
              )}
              {virtualRows.map((virtualRow) => {
                const row = rows[virtualRow.index];
                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-muted/40"
                  >
                    {row.getVisibleCells().map((cell, idx) => (
                      <TableCell
                        key={cell.id}
                        onDoubleClick={() =>
                          handleCopyCell(cell.getValue())
                        }
                        style={{ width: cell.column.getSize() }}
                        className={cn(
                          DENSITY_CELL_PADDING[density],
                          "cursor-default truncate",
                          idx === 0 && "sticky left-0 z-10 bg-card"
                        )}
                        title="Double-click to copy"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
              {paddingBottom > 0 && (
                <tr>
                  <td style={{ height: paddingBottom }} colSpan={columns.length} />
                </tr>
              )}
            </TableBody>
          </table>
        </div>
      )}

      {!isLoading && !isError && rows.length > 0 && (
        <DataTablePagination table={table} />
      )}
    </div>
  );
}
