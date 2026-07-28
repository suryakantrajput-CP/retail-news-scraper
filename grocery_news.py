from datetime import date
from pathlib import Path

import pandas as pd
from bs4 import BeautifulSoup
from patchright.sync_api import sync_playwright

STORE_NEWS_DIR = Path("data/grocery_news")
STORE_NEWS_DIR.mkdir(parents=True, exist_ok=True)
MASTER_DIR = Path("master_file")
MASTER_DIR.mkdir(parents=True, exist_ok=True)
MASTER_FILE = MASTER_DIR / "grocery_news_master.parquet"
LEGACY_SNAPSHOT = Path("all_articles.parquet")  # one-time seed for the master file, see below

# ── PER-SITE PARSERS ──────────────────────────────────────────────────────────

def parse_chainstoreage(html):
    soup = BeautifulSoup(html, "html.parser")
    rows = []
    for article in soup.find_all("li", class_="astro-qfq2qjl6"):
        title = link = None
        heading = article.find("h2", class_="card__heading")
        if heading:
            a = heading.find("a", class_="heading__link")
            if a:
                title = a.get_text(strip=True)
                link = "https://chainstoreage.com" + a["href"]
        if not title:
            h3 = article.find("h3", class_="teaser-card__heading")
            if h3:
                a = h3.find_parent("a")
                if a and a.get("href"):
                    title = h3.get_text(strip=True)
                    link = "https://chainstoreage.com" + a["href"]
        if title:
            rows.append({"title": title, "link": link, "date": None})
    return rows


def parse_commercialsearch(html):
    soup = BeautifulSoup(html, "html.parser")
    rows = []
    for article in soup.find_all("div", class_="fl-post-feed-post"):
        heading_tag = article.find("h2", class_="fl-post-title")
        link_tag = heading_tag.find("a") if heading_tag else None
        meta_tag = article.find("div", class_="fl-post-meta")
        sep = meta_tag.find("span", class_="fl-post-meta-sep") if meta_tag else None
        date_val = sep.next_sibling.strip() if sep and sep.next_sibling else None
        rows.append({
            "title": heading_tag.get_text(strip=True) if heading_tag else None,
            "link":  link_tag["href"] if link_tag else None,
            "date":  date_val,
        })
    return rows


def parse_grocerybusiness(html):
    soup = BeautifulSoup(html, "html.parser")
    rows = []
    for article in soup.find_all("div", class_="tdb_module_loop"):
        title_tag = article.find("h3", class_="entry-title")
        link_tag  = title_tag.find("a") if title_tag else None
        date_tag  = article.find("time", class_="entry-date")
        rows.append({
            "title": link_tag.get_text(strip=True) if link_tag else None,
            "link":  link_tag["href"] if link_tag else None,
            "date":  date_tag.get_text(strip=True) if date_tag else None,
        })
    return rows


def parse_rebusiness(html):
    soup = BeautifulSoup(html, "html.parser")
    rows = []
    for article in soup.find_all("article", class_="standard-article"):
        heading_tag = article.find("h2", class_="entry-title")
        link_tag    = heading_tag.find("a") if heading_tag else None
        date_tag    = article.find("time", class_="entry-date")
        rows.append({
            "title": heading_tag.get_text(strip=True) if heading_tag else None,
            "link":  link_tag.get("href") if link_tag else None,
            "date":  date_tag.get_text(strip=True) if date_tag else None,
        })
    return rows


def parse_retailtouchpoints(html):
    soup = BeautifulSoup(html, "html.parser")
    rows = []
    for article in soup.find_all("div", class_="story-container"):
        heading_tag = article.find("h2")
        link_tag    = heading_tag.find("a") if heading_tag else None
        date_tag    = article.find("span", class_="publish-date")
        rows.append({
            "title": heading_tag.get_text(strip=True) if heading_tag else None,
            "link":  link_tag.get("href") if link_tag else None,
            "date":  date_tag.get_text(strip=True) if date_tag else None,
        })
    return rows


def parse_shoppingcenter(html):
    soup = BeautifulSoup(html, "html.parser")
    rows = []
    for article in soup.find_all("article", class_="standard-article"):
        heading_tag = article.find("h2", class_="entry-title")
        link_tag    = heading_tag.find("a") if heading_tag else None
        date_tag    = article.find("time", class_="entry-date")
        rows.append({
            "title": link_tag.get_text(strip=True) if link_tag else None,
            "link":  link_tag["href"] if link_tag else None,
            "date":  date_tag.get_text(strip=True) if date_tag else None,
        })
    return rows


def parse_supermarketnews(html):
    soup = BeautifulSoup(html, "html.parser")
    rows = []
    for article in soup.find_all("div", class_="ContentPreview"):
        title_tag = (
            article.find("a", class_="ContentCard-Title") or
            article.find("a", class_="ListPreview-Title") or
            article.find("a", class_="ArticlePreview-Title")
        )
        date_tag = (
            article.find("span", class_="ContentCard-Date") or
            article.find("span", class_="ListPreview-Date") or
            article.find("span", class_="ArticlePreview-Date")
        )
        href = title_tag.get("href", "") if title_tag else ""
        rows.append({
            "title": title_tag.get_text(strip=True) if title_tag else None,
            "link":  "https://www.supermarketnews.com" + href if href.startswith("/") else href,
            "date":  date_tag.get_text(strip=True) if date_tag else None,
        })
    return rows


# ── SITE CONFIG ───────────────────────────────────────────────────────────────

SITES = [
    ("chainstoreage",        "https://chainstoreage.com/store-spaces",                                   "li.astro-qfq2qjl6",       parse_chainstoreage),
    ("commercialsearch",     "https://www.commercialsearch.com/news/retail/",                            "div.fl-post-feed-post",    parse_commercialsearch),
    ("grocerybusiness",      "https://www.grocerybusiness.ca/category/industry-news/",                   "div.tdb_module_loop",      parse_grocerybusiness),
    ("rebusiness_restaurant","https://rebusinessonline.com/category/property-type/retail/restaurant/",   "article.standard-article", parse_rebusiness),
    ("rebusiness_retail",    "https://rebusinessonline.com/category/property-type/retail/",              "article.standard-article", parse_rebusiness),
    ("retailtouchpoints",    "https://www.retailtouchpoints.com/topic/market-news/",                     "div.story-container",      parse_retailtouchpoints),
    ("shoppingcenter",       "https://shoppingcenterbusiness.com/category/retailers/",                   "article.standard-article", parse_shoppingcenter),
    ("supermarketnews",      "https://www.supermarketnews.com/grocery-operations/store-closings",        "div.ListContent-Body",     parse_supermarketnews),
]


def extract_body_text(html):
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "nav", "header", "footer", "aside"]):
        tag.decompose()
    body = (
        soup.find("div", class_=lambda c: c and "ArticleBody" in c) or
        soup.find("div", class_=lambda c: c and "article-body" in (c or "").lower()) or
        soup.find("div", class_=lambda c: c and "post-content" in (c or "").lower()) or
        soup.find("article") or
        soup.find("main")
    )
    return body.get_text(separator=" ", strip=True) if body else ""


# ── MAIN ──────────────────────────────────────────────────────────────────────

all_records = []

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=False,
        args=["--no-sandbox", "--disable-setuid-sandbox"],
    )
    context = browser.new_context(viewport={"width": 1280, "height": 800}, locale="en-US")
    page = context.new_page()

    # Phase 1: collect article listings
    for source, url, selector, parser in SITES:
        print(f"[listing] {source}")
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=30000)
            page.wait_for_function("document.title !== 'Just a moment...'", timeout=20000)
            page.wait_for_selector(selector, timeout=15000)
            rows = parser(page.content())
            for r in rows:
                r["source"] = source
            all_records.extend(rows)
            print(f"  -> {len(rows)} articles")
        except Exception as e:
            print(f"  [error] {source}: {e}")

    df = pd.DataFrame(all_records).dropna(subset=["link"])
    df = df[df["link"].str.strip() != ""].reset_index(drop=True)
    print(f"\nTotal articles collected: {len(df)}")

    # Phase 2: fetch full article text
    print("\n[content] fetching article bodies...")
    content_rows = []
    for idx, link in enumerate(df["link"], 1):
        try:
            page.goto(link, wait_until="domcontentloaded", timeout=30000)
            page.wait_for_function("document.title !== 'Just a moment...'", timeout=15000)
            text = extract_body_text(page.content())
        except Exception as e:
            print(f"  [{idx}/{len(df)}] error: {e}")
            text = ""
        content_rows.append({"link": link, "content": text})
        if idx % 10 == 0:
            print(f"  {idx}/{len(df)} done")

    browser.close()

# ── SAVE ──────────────────────────────────────────────────────────────────────

df_content = pd.DataFrame(content_rows)
df_final   = df.merge(df_content, on="link", how="left")
df_final   = df_final[["source", "title", "date", "link", "content"]]

today = date.today().strftime("%Y-%m-%d")
daily_file = STORE_NEWS_DIR / f"grocery_news_{today}.parquet"
df_final.to_parquet(daily_file, index=False)
print(f"\nDaily file saved: {daily_file} ({len(df_final)} articles)")
print(df_final[["source", "title", "date"]].to_string(index=False))

# ────────────────────────────────────────────────
# Master file — accumulates all daily results
# ────────────────────────────────────────────────
df_new = df_final.copy()
df_new["date_appended"] = today

if MASTER_FILE.exists():
    df_master = pd.read_parquet(MASTER_FILE)
    df_master = pd.concat([df_master, df_new], ignore_index=True)
elif LEGACY_SNAPSHOT.exists():
    # Before this master file existed, each run overwrote a single
    # all_articles.parquet snapshot with no history — seed the master
    # with whatever that last snapshot held so history starts from here.
    df_master = pd.read_parquet(LEGACY_SNAPSHOT)
    df_master["date_appended"] = today
    df_master = pd.concat([df_master, df_new], ignore_index=True)
else:
    df_master = df_new

df_master = df_master.drop_duplicates(subset=["link"])
# Newest scrape day first — matches priority_banner.py / grocery_db_news.py.
# `date` is inconsistent free text scraped per-site (or missing entirely),
# so date_appended (day granularity) is the best available sort key;
# `kind="stable"` keeps same-day rows in their original site order.
df_master = df_master.sort_values("date_appended", ascending=False, kind="stable")
df_master.to_parquet(MASTER_FILE, index=False)
print(f"Master file updated: {MASTER_FILE} ({len(df_master)} total articles)")
