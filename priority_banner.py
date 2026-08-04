import argparse
import base64
import json
import os
import re
import sys
import time
from collections import defaultdict
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
# Output directory setup
# ────────────────────────────────────────────────
STORE_NEWS_DIR = Path("data/store_news")
JSON_ARCHIVE_DIR = Path("data/store_news/json_archive")
STORE_NEWS_DIR.mkdir(parents=True, exist_ok=True)
JSON_ARCHIVE_DIR.mkdir(parents=True, exist_ok=True)


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
    ts_match  = re.search(r'data-n-a-ts="([^"]+)"', html)
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
# Load store names from analyst.csv (single "store" column)
# ────────────────────────────────────────────────

def load_stores(csv_file=Path('analyst.csv')) -> list[str]:
    if not csv_file.exists():
        raise FileNotFoundError(f"{csv_file} not found")

    df = pd.read_csv(csv_file, encoding='latin-1')
    df.columns = [c.strip().lower() for c in df.columns]
    df['store'] = df['store'].astype(str).str.strip()
    df = df[df['store'].str.len() > 0]
    stores = df['store'].drop_duplicates().tolist()
    print(f"→ Loaded {len(stores)} stores from analyst.csv")
    return stores


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


# Single source of truth for the open/close phrase sets and the retail-context
# words. build_query() joins these into the Google News query string, and
# is_relevant() re-checks the same lists against the fetched title/summary —
# Google News' RSS search doesn't strictly AND a long OR-heavy query (it's
# relevance/date ranked, not a hard filter), so junk like "Rifle Gap State
# Park" or "Gift Nifty Gap-Up" matches the query string but shares no actual
# words with these lists.
OPEN_PHRASES = [
    "new store", "new location", "opening soon", "coming soon",
    "grand opening", "now open", "opens new", "opening in",
    "to open", "set to open", "plans to open", "breaks ground",
    "now hiring", "store opening", "location opening",
    "will open", "opening date", "opening weekend",
    "soft opening", "ribbon cutting", "open for business",
    "doors open", "expanding to", "announced plans",
    "plans announced", "permit filed", "building permit",
    "permit application", "zoning approval", "site plan approved",
    "lease signed", "signed lease", "retail space leased",
    "land acquired", "site acquired", "broke ground",
    "groundbreaking ceremony", "under construction",
    "construction underway", "construction started",
    "construction begins", "tenant improvement",
    "interior build-out", "build out", "certificate of occupancy",
]

CLOSE_PHRASES = [
    "store closing", "closing soon", "closing", "closures",
    "shutting down", "shutters", "permanent closure", "permanent closing",
    "going out of business", "going-out-of-business", "liquidation",
    "everything must go", "store closing sale", "last day", "final day",
    "final closing", "ceases operations", "store to close", "stores to close",
    "closing all locations", "closing locations", "shutter stores",
]

CONTEXT_WORDS = [
    "store", "location", "retail", "shop", "outlet", "station",
    "pharmacy", "supermarket", "grocery", "auto parts",
]


def build_query(store: str, is_closure: bool = False) -> str:
    phrases     = CLOSE_PHRASES if is_closure else OPEN_PHRASES
    keywords    = " OR ".join(f'"{p}"' for p in phrases)
    context     = "(" + " OR ".join(f'"{w}"' if " " in w else w for w in CONTEXT_WORDS) + ")"
    locations   = '(USA OR Canada OR "United States" OR America OR state OR city OR county)'
    recent_date = (date.today() - timedelta(days=4)).strftime('%Y-%m-%d')

    return f'"{store}" {keywords} {context} {locations} after:{recent_date}'


def is_relevant(store: str, title: str, summary: str, is_closure: bool) -> bool:
    """Re-validate a fetched article against the same phrase/context lists used
    to build the query. Needed because Google News' RSS search doesn't strictly
    enforce the query's AND logic — it ranks by relevance/date, so articles that
    merely contain the store name as a common word (e.g. "Gap") slip through
    even when they share no actual retail vocabulary with the query."""
    combined = f"{title} {summary}".lower()

    def has_word(phrase: str) -> bool:
        # \b-bounded so e.g. "pharmacy" doesn't match inside the domain name
        # "pharmacypracticenews.com" that clean_summary() appends to the text.
        return re.search(rf"\b{re.escape(phrase)}\b", combined) is not None

    if not has_word(store.lower()):
        return False

    phrases = CLOSE_PHRASES if is_closure else OPEN_PHRASES
    if not any(has_word(p) for p in phrases):
        return False

    if not any(has_word(w) for w in CONTEXT_WORDS):
        return False

    return True


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


def fetch_news_for_store(store: str, is_closure: bool = False) -> list[dict]:
    query         = build_query(store, is_closure=is_closure)
    encoded_query = quote_plus(query)
    rss_url = (
        f"https://news.google.com/rss/search?q={encoded_query}"
        f"&hl=en-US&gl=US&ceid=US:en&scoring=d"
    )

    body = fetch_via_zyte(rss_url)
    if body is None:
        return []

    feed        = feedparser.parse(body)
    cutoff_date = date.today() - timedelta(days=2)

    results = []
    for entry in feed.entries:
        published_str = entry.get('published', 'Date not available')
        if not is_recent(published_str, cutoff_date):
            continue

        title       = entry.title
        raw_summary = entry.get('summary', 'No summary')
        summary     = clean_summary(raw_summary)

        # Filter before resolving the real URL (a Zyte round trip) so junk
        # articles that only coincidentally matched the query don't cost us
        # an extra API call.
        if not is_relevant(store, title, summary, is_closure):
            continue

        real_link = resolve_real_url(entry.get('link', ''))
        results.append({
            'title':     title,
            'link':      real_link,
            'published': published_str,
            'summary':   summary,
            'type':      'Closing' if is_closure else 'Opening',
        })

    results.sort(key=lambda x: x['published'], reverse=True)
    return results


# ────────────────────────────────────────────────
# Main execution
# ────────────────────────────────────────────────

def process_store(store: str) -> list[dict]:
    results_open  = fetch_news_for_store(store, is_closure=False)
    results_close = fetch_news_for_store(store, is_closure=True)
    return [
        {
            'company_name': store,
            'event_type':   res['type'],
            'Title':        res['title'],
            'Link':         res['link'],
            'Published':    res['published'],
            'Summary':      res['summary'],
        }
        for res in results_open + results_close
    ]


def main():
    parser = argparse.ArgumentParser(description="Fetch store opening/closing news via Zyte + Google News.")
    parser.add_argument("--limit", type=int, default=None, help="Only process the first N stores (for testing)")
    parser.add_argument("--workers", type=int, default=6, help="Concurrent Zyte requests")
    args = parser.parse_args()

    stores = load_stores()
    if args.limit:
        stores = stores[:args.limit]

    print(f"\nRun date: {date.today()}")
    print(f"Fetching recent (last 2 days) store OPENING + CLOSING news for {len(stores)} stores "
          f"({args.workers} concurrent Zyte requests)...\n")

    rows_by_store = defaultdict(list)
    start_time = time.time()
    completed = 0
    total_articles = 0

    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {executor.submit(process_store, store): store for store in stores}
        for future in as_completed(futures):
            store = futures[future]
            try:
                items = future.result()
            except Exception as e:
                print(f"  ⚠ {store}: error - {e}")
                items = []

            rows_by_store[store].extend(items)
            completed += 1
            total_articles += len(items)

            elapsed = time.time() - start_time
            eta_min = (elapsed / completed) * (len(stores) - completed) / 60
            print(f"[{completed}/{len(stores)}] {store}: {len(items)} article(s) "
                  f"| elapsed {elapsed/60:.1f}m | ETA {eta_min:.1f}m | total found: {total_articles}")

    all_rows = [row for items in rows_by_store.values() for row in items]

    # ────────────────────────────────────────────────
    # Output
    # ────────────────────────────────────────────────
    today_str = date.today().strftime("%Y-%m-%d")

    if not all_rows:
        print("No recent store opening or closing news found in the last 2 days.")
    else:
        print("=" * 85)
        print("     STORE OPENING & CLOSING NEWS (last 2 days only)")
        print("=" * 85 + "\n")

        for store, items in rows_by_store.items():
            if not items:
                continue
            print(f"Store: {store}   ({len(items)} article(s))")
            print("-" * 70)

            for i, item in enumerate(items, 1):
                print(f"{i}. [{item['event_type']}] {item['Title']}")
                print(f"   Published: {item['Published']}")
                print(f"   Link:      {item['Link']}")
                summary_short = (item['Summary'][:220] + "...") if len(item['Summary']) > 220 else item['Summary']
                print(f"   {summary_short}\n")

            print()

        df_out   = pd.DataFrame(all_rows)
        filename = STORE_NEWS_DIR / f"banner_news_{today_str}.csv"
        df_out.to_csv(filename, index=False, encoding='utf-8')
        print(f"\nResults saved to: {filename}")
        print(f"Total articles: {len(all_rows)}")

        # ────────────────────────────────────────────────
        # Master file — accumulates all daily results
        # ────────────────────────────────────────────────
        MASTER_BANNER_NEWS_FILE = Path("master_file")
        MASTER_BANNER_NEWS_FILE.mkdir(parents=True, exist_ok=True)
        MASTER_FILE = MASTER_BANNER_NEWS_FILE / "banner_news_master.csv"

        df_new = df_out.copy()
        df_new['Date_Appended'] = today_str
        df_new['Published'] = pd.to_datetime(df_new['Published'], errors='coerce', utc=True)

        if MASTER_FILE.exists():
            df_master = pd.read_csv(MASTER_FILE, encoding='utf-8')
            df_master['Published'] = pd.to_datetime(df_master['Published'], errors='coerce', utc=True)
            df_master = pd.concat([df_master, df_new], ignore_index=True)
        else:
            df_master = df_new

        # Deduplicate on company_name + Title + Link — more robust than using Published
        # because the same article can have slightly different timestamp strings
        # across runs while Link is a stable identifier.
        df_master = df_master.drop_duplicates(subset=['company_name', 'Title', 'Link'])
        df_master = df_master.sort_values('Published', ascending=False)
        df_master.to_csv(MASTER_FILE, index=False, encoding='utf-8')
        print(f"✓ Master file updated: {MASTER_FILE}  ({len(df_master)} total rows)")

    # ────────────────────────────────────────────────
    # Always create latest_news.json (even if no news found)
    # ────────────────────────────────────────────────
    json_data = {
        "last_updated": today_str,
        "data": {store: items for store, items in rows_by_store.items() if items},
    }

    with open('latest_news.json', 'w', encoding='utf-8') as f:
        json.dump(json_data, f, ensure_ascii=False, indent=2)

    archive_filename = JSON_ARCHIVE_DIR / f"latest_news_{today_str}.json"
    with open(archive_filename, 'w', encoding='utf-8') as f:
        json.dump(json_data, f, ensure_ascii=False, indent=2)

    print(f"\n✓ latest_news.json created/updated at root (last_updated: {today_str})")
    print(f"✓ {archive_filename} created as historical snapshot")


if __name__ == "__main__":
    main()
