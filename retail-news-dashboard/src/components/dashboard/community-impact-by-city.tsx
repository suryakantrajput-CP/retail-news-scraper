"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CommunityImpactRow } from "@/lib/types";

function groupByLatestCity(rows: CommunityImpactRow[]) {
  const tagged = rows.filter((r) => r.city);
  if (tagged.length === 0) return [];

  // Only rows with a `city` exist from the day this feature shipped onward,
  // so the most recent date_appended among them is effectively "the latest
  // scrape" — mirrors the live snapshot the source site itself shows,
  // rather than piling up every city-tagged row across all history.
  const latestDate = tagged.reduce(
    (max, r) => (r.dateAppended && r.dateAppended > max ? r.dateAppended : max),
    tagged[0].dateAppended ?? ""
  );

  const latest = tagged.filter((r) => r.dateAppended === latestDate);

  const byCity = new Map<string, CommunityImpactRow[]>();
  for (const row of latest) {
    const list = byCity.get(row.city) ?? [];
    list.push(row);
    byCity.set(row.city, list);
  }

  return Array.from(byCity.entries());
}

export function CommunityImpactByCity({ rows }: { rows: CommunityImpactRow[] }) {
  const groups = groupByLatestCity(rows);

  if (groups.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {groups.map(([city, articles]) => (
        <Card key={city}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{city}</span>
              <span className="text-sm font-normal text-muted-foreground">
                {articles.length} article{articles.length === 1 ? "" : "s"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <a
                  key={article.id}
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group overflow-hidden rounded-lg border bg-card transition hover:shadow-md"
                >
                  <div className="relative aspect-[16/10] bg-muted">
                    {article.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={article.image}
                        alt={article.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : null}
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug text-card-foreground transition-colors group-hover:text-primary">
                      {article.title}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {article.date ?? "—"}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
