"use client";

import { Bell, Store, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppData } from "@/lib/data-context";
import { colorForEventType } from "@/lib/chart-colors";

export function Notifications() {
  const { priority: data } = useAppData();

  const recent = [...data.rows]
    .sort((a, b) => {
      const ta = a.published ? new Date(a.published).getTime() : 0;
      const tb = b.published ? new Date(b.published).getTime() : 0;
      return tb - ta;
    })
    .slice(0, 6);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" className="relative" aria-label="Notifications" />}
      >
        <Bell className="h-[18px] w-[18px]" />
        {recent.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {recent.length}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Latest priority alerts</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {recent.length === 0 && (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            No alerts yet — run priority_banner.py to populate this feed.
          </div>
        )}
        <div className="max-h-80 overflow-y-auto">
          {recent.map((row) => (
            <a
              key={row.id}
              href={row.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2.5 px-2 py-2.5 text-sm hover:bg-accent rounded-md"
            >
              <Store
                className="mt-0.5 h-4 w-4 shrink-0"
                style={{ color: colorForEventType(row.event_type) }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{row.company_name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {row.title}
                </p>
              </div>
              <Badge variant="outline" className="shrink-0 text-[10px]">
                {row.event_type}
              </Badge>
              <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
            </a>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
