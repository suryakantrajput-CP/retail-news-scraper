import argparse
import base64
import json
import os
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, timedelta
from html import unescape
from pathlib import Path
from urllib.parse import quote, quote_plus, urlparse

import feedparser
import pandas as pd
import requests
from dateutil import parser as date_parser
from dotenv import load_dotenv

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

load_dotenv()
ZYTE_API_KEY = os.environ["ZYTE_API_KEY"]
ZYTE_API_URL = "https://api.zyte.com/v1/extract"

# ────────────────────────────────────────────────
# Input / output paths
# ────────────────────────────────────────────────
COMPANY_FILE = Path("Industy_type_Grocery_ROC.xlsx")
COMPANY_SHEETS = ["Batch 1", "Batch 2"]

STORE_NEWS_DIR = Path("data/grocery_db_news")
STORE_NEWS_DIR.mkdir(parents=True, exist_ok=True)
MASTER_DIR = Path("master_file")
MASTER_DIR.mkdir(parents=True, exist_ok=True)
MASTER_FILE = MASTER_DIR / "grocery_db_news_master.csv"
PROGRESS_FILE = STORE_NEWS_DIR / "progress_state.json"


# ────────────────────────────────────────────────
# Google News URL Decoder
#
# Google News RSS links are opaque redirect tokens (news.google.com/rss/articles/...).
# Resolving them to the real article URL requires a two-step round trip to Google's
# backend: fetch a signature+timestamp from the article page, then POST that to
# Google's batchexecute endpoint. Both requests go through Zyte since they hit the
# same Google infrastructure that was blocking direct requests.
# ────────────────────────────────────────────────

def _extract_gnews_id(link: str) -> str | None:
    path = urlparse(link).path.split('/')
    if len(path) > 1 and path[-2] in ('articles', 'read'):
        return path[-1]
    return None


def resolve_real_url(link: str) -> str:
    gnews_id = _extract_gnews_id(link)
    if not gnews_id:
        return link

    page = fetch_via_zyte(f"https://news.google.com/articles/{gnews_id}")
    if page is None:
        return link

    html = page.decode('utf-8', errors='ignore')
    sig_match = re.search(r'data-n-a-sg="([^"]+)"', html)
    ts_match = re.search(r'data-n-a-ts="([^"]+)"', html)
    if not (sig_match and ts_match):
        return link
    signature, timestamp = sig_match.group(1), ts_match.group(1)

    inner_payload = (
        f'["garturlreq",[["X","X",["X","X"],null,null,1,1,"US:en",null,1,'
        f'null,null,null,null,null,0,1],"X","X",1,[1,1,1],1,1,null,0,0,null,0],'
        f'"{gnews_id}",{timestamp},"{signature}"]'
    )
    body_str = f'f.req={quote(json.dumps([[["Fbv4je", inner_payload]]]))}'

    for attempt in range(1, 3):
        try:
            resp = requests.post(
                ZYTE_API_URL,
                auth=(ZYTE_API_KEY, ""),
                json={
                    "url": "https://news.google.com/_/DotsSplashUi/data/batchexecute",
                    "httpResponseBody": True,
                    "httpRequestMethod": "POST",
                    "httpRequestBody": base64.b64encode(body_str.encode()).decode(),
                    "customHttpRequestHeaders": [
                        {"name": "Content-Type", "value": "application/x-www-form-urlencoded;charset=UTF-8"}
                    ],
                },
                timeout=30,
            )
            resp.raise_for_status()
            response_body = base64.b64decode(resp.json()["httpResponseBody"]).decode('utf-8')
            parsed = json.loads(response_body.split("\n\n")[1])[:-2]
            return json.loads(parsed[0][2])[1]
        except Exception:
            if attempt == 2:
                return link
            time.sleep(1)
    return link


# ────────────────────────────────────────────────
# Load grocery company names from both sheets of the ROC workbook
# ────────────────────────────────────────────────

def load_companies(xlsx_file: Path = COMPANY_FILE) -> list[str]:
    if not xlsx_file.exists():
        raise FileNotFoundError(f"{xlsx_file} not found")

    companies: list[str] = []
    seen: set[str] = set()
    for sheet in COMPANY_SHEETS:
        df = pd.read_excel(xlsx_file, sheet_name=sheet)
        col = df.columns[0]
        for name in df[col].astype(str).str.strip():
            if name and name.lower() != "nan" and name not in seen:
                seen.add(name)
                companies.append(name)

    print(f"→ Loaded {len(companies)} unique companies from {xlsx_file.name} "
          f"({', '.join(COMPANY_SHEETS)})")
    return companies


# ────────────────────────────────────────────────
# Batch progress tracking — lets the script be re-run repeatedly through the
# day, each time picking up the next chunk of companies instead of starting
# over, so a single run never has to churn through all ~2,100 companies.
# ────────────────────────────────────────────────

def load_progress(companies: list[str]) -> dict:
    today_str = date.today().isoformat()
    if PROGRESS_FILE.exists():
        try:
            state = json.loads(PROGRESS_FILE.read_text(encoding="utf-8"))
        except Exception:
            state = {}
        if state.get("date") == today_str and state.get("companies") == companies:
            return state
    return {"date": today_str, "companies": companies, "processed_index": 0, "completed": False}


def save_progress(state: dict) -> None:
    PROGRESS_FILE.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")


# ────────────────────────────────────────────────
# Helper functions
# ────────────────────────────────────────────────
_TAG_RE = re.compile(r"<[^>]+>")


def clean_summary(summary: str) -> str:
    if not summary:
        return "No summary"
    text = unescape(str(summary))
    text = _TAG_RE.sub("", text)
    text = " ".join(text.split())
    return text or "No summary"


def is_recent(published_str, cutoff_date):
    if not published_str or published_str == 'Date not available':
        return False
    try:
        pub_date = date_parser.parse(published_str).date()
        return pub_date >= cutoff_date
    except Exception:
        return False


def build_query(company: str, is_closure: bool = False) -> str:
    base_keywords_open = (
        '"new store" OR "new location" OR "opening soon" OR "coming soon" OR '
        '"grand opening" OR "now open" OR "opens new" OR "opening in" OR '
        '"to open" OR "set to open" OR "plans to open" OR "breaks ground" OR '
        '"now hiring" OR "store opening" OR "location opening" OR '
        '"will open" OR "opening date" OR "opening weekend" OR '
        '"soft opening" OR "ribbon cutting" OR "open for business" OR '
        '"doors open" OR "expanding to" OR "announced plans" OR '
        '"plans announced" OR "permit filed" OR "building permit" OR '
        '"permit application" OR "zoning approval" OR "site plan approved" OR '
        '"lease signed" OR "signed lease" OR "retail space leased" OR '
        '"land acquired" OR "site acquired" OR "broke ground" OR '
        '"groundbreaking ceremony" OR "under construction" OR '
        '"construction underway" OR "construction started" OR '
        '"construction begins" OR "tenant improvement" OR '
        '"interior build-out" OR "build out" OR "certificate of occupancy"'
    )

    base_keywords_close = (
        '"store closing" OR "closing soon" OR "closing" OR "closures" OR '
        '"shutting down" OR "shutters" OR "permanent closure" OR "permanent closing" OR '
        '"going out of business" OR "going-out-of-business" OR "liquidation" OR '
        '"everything must go" OR "store closing sale" OR "last day" OR "final day" OR '
        '"final closing" OR "ceases operations" OR "store to close" OR "stores to close" OR '
        '"closing all locations" OR "closing locations" OR "shutter stores"'
    )

    keywords = base_keywords_close if is_closure else base_keywords_open
    context = '(store OR location OR retail OR shop OR outlet OR station OR pharmacy OR supermarket OR grocery OR "auto parts")'
    locations = '(USA OR Canada OR "United States" OR America OR state OR city OR county)'
    recent_date = (date.today() - timedelta(days=4)).strftime('%Y-%m-%d')

    return f'"{company}" {keywords} {context} {locations} after:{recent_date}'


def fetch_via_zyte(url: str, max_retries: int = 3) -> bytes | None:
    """Fetch a URL through the Zyte API so repeated Google requests aren't
    all coming from our own IP (which is what triggers Google's blocking)."""
    for attempt in range(1, max_retries + 1):
        try:
            resp = requests.post(
                ZYTE_API_URL,
                auth=(ZYTE_API_KEY, ""),
                json={"url": url, "httpResponseBody": True},
                timeout=60,
            )
            resp.raise_for_status()
            return base64.b64decode(resp.json()["httpResponseBody"])
        except Exception as e:
            if attempt == max_retries:
                print(f"   ⚠ Zyte fetch failed: {e}")
                return None
            time.sleep(2 * attempt)
    return None


def fetch_news_for_company(company: str, is_closure: bool = False) -> list[dict]:
    query = build_query(company, is_closure=is_closure)
    encoded_query = quote_plus(query)
    rss_url = (
        f"https://news.google.com/rss/search?q={encoded_query}"
        f"&hl=en-US&gl=US&ceid=US:en&scoring=d"
    )

    body = fetch_via_zyte(rss_url)
    if body is None:
        return []

    feed = feedparser.parse(body)
    cutoff_date = date.today() - timedelta(days=2)

    results = []
    for entry in feed.entries:
        published_str = entry.get('published', 'Date not available')
        if not is_recent(published_str, cutoff_date):
            continue

        real_link = resolve_real_url(entry.get('link', ''))
        raw_summary = entry.get('summary', 'No summary')
        results.append({
            'title': entry.title,
            'link': real_link,
            'published': published_str,
            'summary': clean_summary(raw_summary),
            'type': 'Closing' if is_closure else 'Opening',
        })

    results.sort(key=lambda x: x['published'], reverse=True)
    return results


# ────────────────────────────────────────────────
# Main execution
# ────────────────────────────────────────────────

def process_company(company: str) -> list[dict]:
    results_open = fetch_news_for_company(company, is_closure=False)
    results_close = fetch_news_for_company(company, is_closure=True)
    return [
        {
            'company_name': company,
            'event_type': res['type'],
            'Title': res['title'],
            'Link': res['link'],
            'Published': res['published'],
            'Summary': res['summary'],
        }
        for res in results_open + results_close
    ]


def main():
    parser = argparse.ArgumentParser(
        description="Fetch grocery-company opening/closing news via Zyte + Google News, "
                    "processing the company list in batches so a single run stays fast."
    )
    parser.add_argument("--chunk-size", type=int, default=100, help="Companies to process per run")
    parser.add_argument("--workers", type=int, default=6, help="Concurrent Zyte requests")
    parser.add_argument("--limit", type=int, default=None, help="Only consider the first N companies overall (for testing)")
    parser.add_argument("--reset", action="store_true", help="Ignore saved progress and start today's run over from company 1")
    args = parser.parse_args()

    companies = load_companies()
    if args.limit:
        companies = companies[:args.limit]

    if args.reset and PROGRESS_FILE.exists():
        PROGRESS_FILE.unlink()

    state = load_progress(companies)
    if state["completed"]:
        print(f"All {len(companies)} companies already processed today ({state['date']}). Nothing to do.")
        print("Pass --reset to force a fresh run for today.")
        return

    start = state["processed_index"]
    end = min(start + args.chunk_size, len(companies))
    batch = companies[start:end]

    print(f"\nRun date: {state['date']}")
    print(f"Processing companies {start + 1}-{end} of {len(companies)} "
          f"({args.workers} concurrent Zyte requests)...\n")

    rows_by_company: dict[str, list[dict]] = {}
    start_time = time.time()
    completed = 0
    total_articles = 0

    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {executor.submit(process_company, c): c for c in batch}
        for future in as_completed(futures):
            company = futures[future]
            try:
                items = future.result()
            except Exception as e:
                print(f"  ⚠ {company}: error - {e}")
                items = []

            rows_by_company[company] = items
            completed += 1
            total_articles += len(items)

            elapsed = time.time() - start_time
            eta_min = (elapsed / completed) * (len(batch) - completed) / 60
            print(f"[{completed}/{len(batch)}] {company}: {len(items)} article(s) "
                  f"| elapsed {elapsed/60:.1f}m | ETA {eta_min:.1f}m | total found: {total_articles}")

    all_rows = [row for items in rows_by_company.values() for row in items]
    today_str = state["date"]

    if all_rows:
        # ────────────────────────────────────────────────
        # Daily file — accumulates every batch run today
        # ────────────────────────────────────────────────
        daily_file = STORE_NEWS_DIR / f"grocery_db_news_{today_str}.csv"
        df_out = pd.DataFrame(all_rows)
        if daily_file.exists():
            df_existing = pd.read_csv(daily_file, encoding='utf-8')
            df_out = pd.concat([df_existing, df_out], ignore_index=True)
        # Dedupe on Title + Link only (not company_name): the source Excel list
        # has multiple name variants for the same chain (e.g. "Dutch Bros",
        # "Dutch Bros Coffee", "Dutch Bros. Coffee"), so the same real article
        # can otherwise get recorded once per spelling.
        df_out = df_out.drop_duplicates(subset=['Title', 'Link'])
        df_out.to_csv(daily_file, index=False, encoding='utf-8')
        print(f"\nDaily file updated: {daily_file} ({len(df_out)} rows so far today)")

        # ────────────────────────────────────────────────
        # Master file — accumulates all historical results
        # ────────────────────────────────────────────────
        df_new = pd.DataFrame(all_rows)
        df_new['Date_Appended'] = today_str
        df_new['Published'] = pd.to_datetime(df_new['Published'], errors='coerce', utc=True)

        if MASTER_FILE.exists():
            df_master = pd.read_csv(MASTER_FILE, encoding='utf-8')
            df_master['Published'] = pd.to_datetime(df_master['Published'], errors='coerce', utc=True)
            df_master = pd.concat([df_master, df_new], ignore_index=True)
        else:
            df_master = df_new

        df_master = df_master.drop_duplicates(subset=['Title', 'Link'])
        df_master = df_master.sort_values('Published', ascending=False)
        df_master.to_csv(MASTER_FILE, index=False, encoding='utf-8')
        print(f"Master file updated: {MASTER_FILE} ({len(df_master)} total rows)")
    else:
        print("\nNo recent opening/closing news found for this batch.")

    state["processed_index"] = end
    state["completed"] = end >= len(companies)
    save_progress(state)

    remaining = len(companies) - end
    if state["completed"]:
        print(f"\n✓ All {len(companies)} companies processed for {today_str}.")
    else:
        print(f"\n{remaining} companies remaining for {today_str}. Run again to continue with the next batch.")


if __name__ == "__main__":
    main()
