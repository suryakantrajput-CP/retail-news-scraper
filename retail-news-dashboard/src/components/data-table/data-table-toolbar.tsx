"use client";

import { type Table } from "@tanstack/react-table";
import {
  Columns3,
  Download,
  Maximize2,
  Minimize2,
  RefreshCw,
  Rows3,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUiStore, type TableDensity } from "@/store/ui-store";
import { cn } from "@/lib/utils";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  globalFilter: string;
  onGlobalFilterChange: (value: string) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  onExportAll: () => void;
  onExportSelected: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

const DENSITY_OPTIONS: { value: TableDensity; label: string }[] = [
  { value: "compact", label: "Compact" },
  { value: "comfortable", label: "Comfortable" },
  { value: "spacious", label: "Spacious" },
];

export function DataTableToolbar<TData>({
  table,
  globalFilter,
  onGlobalFilterChange,
  onRefresh,
  isRefreshing,
  onExportAll,
  onExportSelected,
  isFullscreen,
  onToggleFullscreen,
}: DataTableToolbarProps<TData>) {
  const density = useUiStore((s) => s.density);
  const setDensity = useUiStore((s) => s.setDensity);
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={globalFilter}
          onChange={(e) => onGlobalFilterChange(e.target.value)}
          placeholder="Search this table…"
          className="h-9 pl-8 pr-8"
        />
        {globalFilter && (
          <button
            onClick={() => onGlobalFilterChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {selectedCount > 0 && (
          <>
            <Badge variant="secondary" className="h-9 gap-1 px-2.5 text-sm">
              {selectedCount} selected
            </Badge>
            <Button variant="outline" size="sm" onClick={onExportSelected} className="h-9 gap-1.5 text-sm">
              <Download className="h-4 w-4" />
              Export selected
            </Button>
          </>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="outline" size="sm" className="h-9 gap-1.5 text-sm" />}
          >
            <Rows3 className="h-4 w-4" />
            <span className="hidden md:inline">Density</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Row density</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {DENSITY_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => setDensity(opt.value)}
                className={cn(density === opt.value && "bg-accent")}
              >
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="outline" size="sm" className="h-9 gap-1.5 text-sm" />}
          >
            <Columns3 className="h-4 w-4" />
            <span className="hidden md:inline">Columns</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {(column.columnDef.meta as { label?: string } | undefined)
                    ?.label ?? column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" size="sm" onClick={onExportAll} className="h-9 gap-1.5 text-sm">
          <Download className="h-4 w-4" />
          <span className="hidden md:inline">Export CSV</span>
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={onRefresh}
          aria-label="Refresh data"
        >
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={onToggleFullscreen}
          aria-label={isFullscreen ? "Exit full screen" : "Full screen"}
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
