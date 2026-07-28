"use client";

import * as React from "react";
import { toast } from "sonner";
import { Copy, Sparkles, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DataTable } from "@/components/data-table/data-table";
import { extractionColumns } from "@/components/data-table/columns-extraction";
import { buildExtractionPrompt } from "@/lib/extraction-prompt";
import { parseExtractionMarkdownTable } from "@/lib/parse-markdown-table";
import { useExtractionStore } from "@/store/extraction-store";
import type { GroceryDbNewsRow } from "@/lib/types";

interface ExtractionPanelProps {
  dailyRows: GroceryDbNewsRow[];
  dailyDate: string | null;
}

export function ExtractionPanel({ dailyRows, dailyDate }: ExtractionPanelProps) {
  const [pasteValue, setPasteValue] = React.useState("");
  const rows = useExtractionStore((s) => s.rows);
  const addRows = useExtractionStore((s) => s.addRows);
  const clearRows = useExtractionStore((s) => s.clearRows);

  const prompt = React.useMemo(() => buildExtractionPrompt(dailyRows), [dailyRows]);

  function handleCopyPrompt() {
    if (dailyRows.length === 0) {
      toast.warning("No daily scrape articles to include", {
        description: "Run grocery_db_news.py first, then refresh this page.",
      });
      return;
    }
    navigator.clipboard.writeText(prompt).then(() => {
      toast.success("Prompt copied to clipboard", {
        description: `Includes the instructions + ${dailyRows.length} article(s) from ${dailyDate ?? "today's"} scrape. Paste into a Claude.ai chat.`,
      });
    });
  }

  function handleParse() {
    if (!pasteValue.trim()) {
      toast.warning("Paste Claude's response first");
      return;
    }
    const parsed = parseExtractionMarkdownTable(pasteValue);
    if (parsed.length === 0) {
      toast.error("No table rows found", {
        description: "Make sure you pasted the full Markdown table Claude returned.",
      });
      return;
    }
    const added = addRows(parsed);
    const skipped = parsed.length - added;
    toast.success(`Added ${added} row(s) to extraction data`, {
      description: skipped > 0 ? `${skipped} row(s) skipped as duplicates already on file.` : undefined,
    });
    setPasteValue("");
  }

  function handleClearAll() {
    if (rows.length === 0) return;
    if (!window.confirm(`Clear all ${rows.length} extracted row(s) from this browser? This can't be undone.`)) {
      return;
    }
    clearRows();
    toast.success("Extraction data cleared");
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> 1. Copy the prompt for Claude
          </CardTitle>
          <CardDescription>
            Copies the extraction instructions plus every article from the{" "}
            {dailyDate ? `${dailyDate} ` : ""}Daily Scrape ({dailyRows.length} article
            {dailyRows.length === 1 ? "" : "s"}). Paste the result into a Claude.ai chat — no API key
            needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Textarea readOnly value={prompt} rows={10} className="max-h-72 overflow-y-auto font-mono text-xs" />
          <Button onClick={handleCopyPrompt} className="w-fit gap-1.5">
            <Copy className="h-4 w-4" /> Copy prompt + {dailyRows.length} article
            {dailyRows.length === 1 ? "" : "s"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Paste Claude&apos;s Markdown table back</CardTitle>
          <CardDescription>
            After Claude replies, paste its full response below (the table plus the non-working list is
            fine — only the table gets parsed).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Textarea
            value={pasteValue}
            onChange={(e) => setPasteValue(e.target.value)}
            placeholder="Paste Claude's response here..."
            rows={10}
            className="max-h-96 overflow-y-auto font-mono text-xs"
          />
          <Button onClick={handleParse} className="w-fit">
            Parse &amp; add to extraction data
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Extracted data</CardTitle>
        </CardHeader>
        <CardContent className="flex items-baseline gap-3">
          <span className="text-4xl font-bold tabular-nums">{rows.length}</span>
          <span className="text-sm text-muted-foreground">
            row{rows.length === 1 ? "" : "s"} extracted · saved in this browser
          </span>
          {rows.length > 0 && (
            <Button variant="ghost" size="sm" className="ml-auto gap-1.5" onClick={handleClearAll}>
              <Trash2 className="h-3.5 w-3.5" /> Clear all
            </Button>
          )}
        </CardContent>
      </Card>

      <DataTable
        columns={extractionColumns}
        data={rows}
        onRefresh={() => {}}
        exportFilename="grocery-db-news-extraction"
        emptyTitle="No extracted data yet"
        emptyDescription="Copy the prompt above into Claude, then paste its Markdown table back to populate this table."
      />
    </div>
  );
}
