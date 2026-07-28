import type { GroceryDbNewsRow } from "@/lib/types";

// Verbatim analyst-authored instructions for manually running Grocery DB
// News articles through Claude (claude.ai chat, no API key). Keep this text
// as given — Claude is the one that interprets it, not this app.
export const EXTRACTION_PROMPT = `You are an expert, precise data extractor specialized in retail and restaurant openings and closures. I will provide multiple news articles (each usually starting with its source URL). For EVERY article, extract the following information strictly and only from the text provided — no assumptions, no external knowledge, no guessing zip codes, no inferring dates or statuses:

🔍 Extract these fields

• Company Name
\t* Store/Shop/Restaurant name.

• Address

* Street address only.
* If full address is given, separate the components into Address, City, State, Zip Code, and Country.
* If address is not provided, leave blank.

• City

* City only.

• State

* State/Province only.

• Zip Code

* Zip/postal code only.
* Never infer or look up zip codes.

• Country

* USA or Canada only.


• Event Type

* Opening
* Closing
* Remodel
* Use only what is explicitly stated in the article.

Opening
- If event_type is opening then it 1
- If event_type is closing then it 0
- If event_type is remodel than it 4

Observation Status —-
- For openings: use article wording such as "planned opening", "opening soon", "set to open", "under construction", "opened", "grand opening", etc.
- For closures: use article wording such as "planned closing", "closing soon", "set to close", "closed", "permanently closed", "shut down", etc.
- For remodels: use article wording such as "under renovation", "remodeling", "renovation   planned", "reopened after remodel", etc.


• Date Effective
  - For openings → Opening Date
  - For closures → Closing Date (write exact date or month/year if mentioned; otherwise write exactly "Not specified")
  -  For Remodel - Remodel date

• Observation Type
  - For openings → use phrasing like: "under construction", "opening soon", "set to open", "recently opened", "grand opening on…", "planned for", etc.
  - For closures → use phrasing like: "closed", "permanently closed", "closing soon", "set to close", "shut down", "liquidation", etc.
  👉 Use the exact phrasing or closest direct wording from the article — do NOT invent or normalize


• Short Description (exactly 2–3 concise sentences summarizing ONLY what the article says — no opinions, no extra context), It start with "[CURRENT_DATE], According to source - " then  Short Description

• Reason

* Only populate for closures when supported by the article.
* Use only one of the following values:

  * business closing/store closing
  * business closing
  * store closing
  * chain closing
  * restaurant closing
  * facility closing
  * DIP/leasing Rejection
  * Rebranding
  * relocating
  * Temporary
  * Mass closing
* If the article does not clearly support one of these values, leave blank.


📊 Output format
Create ONE clean Markdown table with these exact column headers (in this order):
| companyname | address | city | state | zipcode | country | event_type | opening | date_effective | observation_status | reason | short_description | article_link | date_published |

🌎 Geographic filter (STRICT)
• Only extract businesses located in the USA or Canada
• If the article is about a business in any other country (UK, Australia, India, UAE, etc.) → DO NOT add any row to the table; add it ONLY to the Non-working list as "Outside USA/Canada"
• If an article covers both USA/Canada locations AND international locations → extract only the USA/Canada rows, skip the rest; add the article to the Non-working list as "Outside USA/Canada (partial)"

📌 Rules
• Add one row per article in the order the articles are given
• If an article contains multiple businesses, create a separate row for each
• If an article includes both openings and closures, extract each separately
• For Published Date → copy exactly the value from the "Published:" line in the article metadata
• If a USA/Canada article has zero relevant business opening or closure information, still include a row with:
  - Store Name: "No qualifying business found"
  - Other columns: "N/A"
• ❌ Never add a table row for articles outside USA/Canada — those go in the Non-working list only

🚫 Strict constraints
• ❌ No assumptions  • ❌ No external data  • ❌ No inferred addresses or dates  • ❌ No rewriting or normalizing status text
• ❌ No extraction of businesses outside USA or Canada

📎 Final section (mandatory)
At the very end of your response, add:
Non-working or unusable articles List:
• Article number — Reason (paywall / no business details / duplicate / text missing / Outside USA/Canada / etc.)
If none, write: None

✅ Articles below — extract now:`;

function formatArticle(row: GroceryDbNewsRow, index: number): string {
  return [
    `Article ${index + 1}`,
    row.link,
    `Company: ${row.company_name}`,
    `Published: ${row.published ?? "Not specified"}`,
    row.title,
    row.summary,
  ].join("\n");
}

export function buildExtractionPrompt(rows: GroceryDbNewsRow[]): string {
  const articles = rows.map(formatArticle).join("\n\n");
  return `${EXTRACTION_PROMPT}\n\n${articles}`;
}
