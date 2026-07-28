"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import { useAppData } from "@/lib/data-context";

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { grocery, priority } = useAppData();

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const openLink = (link: string) => {
    setOpen(false);
    window.open(link, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open global search"
        className="flex w-full items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/70 sm:max-w-sm"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="hidden truncate sm:inline">
          Search articles, companies, pages…
        </span>
        <span className="ml-auto hidden shrink-0 rounded border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
          ⌘K
        </span>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search articles, companies, pages…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Pages">
            {NAV_ITEMS.map((item) => (
              <CommandItem key={item.href} onSelect={() => go(item.href)}>
                <item.icon className="h-4 w-4" />
                {item.title}
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Grocery News">
            {grocery.rows.slice(0, 30).map((row) => (
              <CommandItem
                key={row.id}
                value={`${row.title} ${row.source}`}
                onSelect={() => openLink(row.link)}
              >
                <span className="truncate">{row.title}</span>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                  {row.source}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Priority Banner">
            {priority.master.rows.slice(0, 30).map((row) => (
              <CommandItem
                key={row.id}
                value={`${row.title} ${row.company_name}`}
                onSelect={() => openLink(row.link)}
              >
                <span className="truncate">{row.title}</span>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                  {row.company_name}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
