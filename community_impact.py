from pathlib import Path

import pandas as pd
from bs4 import BeautifulSoup
from patchright.sync_api import sync_playwright
from datetime import datetime

STORE_NEWS_DIR = Path("data/community_impact")
STORE_NEWS_DIR.mkdir(parents=True, exist_ok=True)
MASTER_DIR = Path("master_file")
MASTER_DIR.mkdir(parents=True, exist_ok=True)
MASTER_FILE = MASTER_DIR / "community_impact_master.csv"

url = "https://communityimpact.com/business/"

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=False,
        args=["--no-sandbox", "--disable-setuid-sandbox"],
    )
    context = browser.new_context(
        viewport={"width": 1280, "height": 800},
        locale="en-US",
    )
    page = context.new_page()
    page.goto(url, wait_until="domcontentloaded", timeout=30000)
    page.wait_for_function("document.title !== 'Just a moment...'", timeout=20000)
    # Wait until at least one article card is rendered by JS
    page.wait_for_selector("div.grid", timeout=15000)
    html = page.content()
    browser.close()

soup = BeautifulSoup(html, "html.parser")

# The page groups articles into per-metro-area sections, each with a city
# heading (e.g. "Austin") followed by a grid of article cards. Walk each
# section so every article record can be tagged with its city.
records = []
for section in soup.find_all('section'):
    header_div = section.find('div', class_=lambda c: c and 'items-center' in c.split() and 'gap-3' in c.split())
    city_tag = header_div.find('h2') if header_div else None
    grid = section.find('div', class_=lambda c: c and 'grid' in c.split())
    if not (city_tag and grid):
        continue

    city = city_tag.get_text(strip=True)
    for article in grid.find_all('article', class_='group'):
        link_tag = article.find('a')
        header_tag = article.find('h3')
        date_tag = article.find('p')

        if not (link_tag and header_tag and date_tag):
            continue

        records.append({
            "city": city,
            "link": "https://communityimpact.com" + link_tag['href'],
            "title": header_tag.get_text(strip=True),
            'date': date_tag.get_text(strip=True)
        })

df = pd.DataFrame(records)
today = datetime.today().strftime("%Y-%m-%d")
df.to_csv(STORE_NEWS_DIR / f"community_impact_{today}.csv", index=False)
print(f"Scraped {len(df)} articles -> {STORE_NEWS_DIR / f'community_impact_{today}.csv'}")

# ────────────────────────────────────────────────
# Master file — accumulates all daily results
# ────────────────────────────────────────────────
df_new = df.copy()
df_new["date_appended"] = today

if MASTER_FILE.exists():
    df_master = pd.read_csv(MASTER_FILE, encoding="utf-8")
    df_master = pd.concat([df_master, df_new], ignore_index=True)
else:
    df_master = df_new

df_master = df_master.drop_duplicates(subset=["title", "link"])
# Newest scrape day first — matches priority_banner.py / grocery_db_news.py.
# There's no per-article timestamp to sort by (only relative text like "16h
# ago"), so date_appended (day granularity) is the best available proxy;
# `kind="stable"` keeps same-day rows in their original site order.
df_master = df_master.sort_values("date_appended", ascending=False, kind="stable")
df_master.to_csv(MASTER_FILE, index=False, encoding="utf-8")
print(f"Master file updated: {MASTER_FILE} ({len(df_master)} total rows)")
