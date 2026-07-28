import type { ExtractionRow } from "@/lib/types";

const FIELDS = [
  "companyname",
  "address",
  "city",
  "state",
  "zipcode",
  "country",
  "event_type",
  "opening",
  "date_effective",
  "observation_status",
  "reason",
  "short_description",
  "article_link",
  "date_published",
] as const;

type Field = (typeof FIELDS)[number];

// Maps a normalized header cell (letters/digits only, lowercased) to the
// canonical field name, tolerating the header variants Claude tends to use
// when it isn't given (or doesn't follow) the exact column names from the
// prompt — e.g. "Store/Shop/Restaurant Name" instead of "companyname", or a
// single combined "Location or Full Address with zip code" instead of
// separate address/city/state/zipcode/country columns.
const HEADER_ALIASES: Record<string, Field> = {
  companyname: "companyname",
  company: "companyname",
  storename: "companyname",
  storeshoprestaurantname: "companyname",
  businessname: "companyname",
  name: "companyname",
  address: "address",
  streetaddress: "address",
  fulladdress: "address",
  location: "address",
  locationorfulladdresswithzipcode: "address",
  locationaddress: "address",
  city: "city",
  state: "state",
  province: "state",
  zipcode: "zipcode",
  zip: "zipcode",
  postalcode: "zipcode",
  country: "country",
  eventtype: "event_type",
  opening: "opening",
  dateeffective: "date_effective",
  eventdate: "date_effective",
  date: "date_effective",
  observationstatus: "observation_status",
  observationtype: "observation_status",
  status: "observation_status",
  reason: "reason",
  shortdescription: "short_description",
  description: "short_description",
  articlelink: "article_link",
  link: "article_link",
  sourcelink: "article_link",
  sourceurl: "article_link",
  url: "article_link",
  datepublished: "date_published",
  published: "date_published",
  publisheddate: "date_published",
};

const OPENING_CODE: Record<string, string> = {
  opening: "1",
  closing: "0",
  remodel: "4",
};

// When Claude's reply omits the numeric `opening` column entirely (common
// when it uses its own simplified header set), derive it mechanically from
// event_type — this is the exact 1/0/4 mapping the prompt itself defines,
// not an inference about article content.
function deriveOpeningCode(eventType: string): string {
  const key = eventType.trim().toLowerCase();
  return OPENING_CODE[key] ?? "";
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function splitRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  // Split on unescaped pipes, then unescape "\|" back to a literal pipe.
  return trimmed.split(/(?<!\\)\|/).map((cell) => cell.trim().replace(/\\\|/g, "|"));
}

function isSeparatorRow(cells: string[]): boolean {
  return cells.every((c) => c === "" || /^:?-{2,}:?$/.test(c));
}

let nextId = 0;
function makeId(): string {
  nextId += 1;
  return `extraction-${Date.now()}-${nextId}`;
}

/**
 * Parses the first Markdown table found in `text` (Claude's pasted-back
 * response) into ExtractionRow objects. Tolerant of extra prose before/after
 * the table and of header wording variations.
 */
export function parseExtractionMarkdownTable(text: string): ExtractionRow[] {
  const tableLines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|") && line.includes("|", 1));

  if (tableLines.length < 2) return [];

  const headerCells = splitRow(tableLines[0]);
  const fieldForColumn = headerCells.map((h) => HEADER_ALIASES[normalizeHeader(h)] ?? null);

  if (fieldForColumn.every((f) => f === null)) return [];

  const dataLines = isSeparatorRow(splitRow(tableLines[1]))
    ? tableLines.slice(2)
    : tableLines.slice(1);

  const rows: ExtractionRow[] = [];
  for (const line of dataLines) {
    const cells = splitRow(line);
    if (isSeparatorRow(cells)) continue;

    const values: Partial<Record<Field, string>> = {};
    fieldForColumn.forEach((field, i) => {
      if (field) values[field] = cells[i] ?? "";
    });

    if (Object.values(values).every((v) => !v)) continue;

    const eventType = values.event_type ?? "";

    rows.push({
      id: makeId(),
      companyname: values.companyname ?? "",
      address: values.address ?? "",
      city: values.city ?? "",
      state: values.state ?? "",
      zipcode: values.zipcode ?? "",
      country: values.country ?? "",
      event_type: eventType,
      opening: values.opening ?? deriveOpeningCode(eventType),
      date_effective: values.date_effective ?? "",
      observation_status: values.observation_status ?? "",
      reason: values.reason ?? "",
      short_description: values.short_description ?? "",
      article_link: values.article_link ?? "",
      date_published: values.date_published ?? "",
    });
  }

  return rows;
}
