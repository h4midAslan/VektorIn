"""
Azərbaycan hackathon/yarış scraper servisi.
Əsas mənbə: edumap.az/musabiqeler (birbaşa scrape)
Əlavə: DuckDuckGo axtarışı
"""
import re
import time
import logging
from urllib.parse import unquote, urlparse, parse_qs

import requests
from bs4 import BeautifulSoup

log = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    )
}

EDUMAP_PAGES = [
    "https://edumap.az/musabiqeler",
    "https://edumap.az/kateqoriya/tedbirler",
]

DDG_QUERIES = [
    "hackathon Azerbaijan 2026",
    "Azərbaycan hackathon 2026",
    "startup competition Baku 2026",
    "Azerbaijan innovation challenge 2026",
]

RELEVANCE_KEYWORDS = [
    "hackathon", "hakaton", "yarış", "müsabiqə", "competition", "challenge",
    "startup", "innovation", "grant", "mükafat", "prize", "olimpiada",
    "tələbə", "student", "qeydiyyat", "registration", "bootcamp",
    "ideathon", "datathon", "olympiad", "inkubasiya", "incubat",
]

DATE_PATTERN = re.compile(
    r"\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2}|"
    r"(?:January|February|March|April|May|June|July|August|September|October|November|December"
    r"|Yanvar|Fevral|Mart|Aprel|May|İyun|İyul|Avqust|Sentyabr|Oktyabr|Noyabr|Dekabr)"
    r"\s+\d{1,2},?\s*\d{4})\b",
    re.IGNORECASE,
)


def _is_relevant(text: str) -> bool:
    t = text.lower()
    return any(kw in t for kw in RELEVANCE_KEYWORDS)


def _fetch_soup(url: str) -> BeautifulSoup | None:
    try:
        r = requests.get(url, headers=HEADERS, timeout=10)
        r.raise_for_status()
        return BeautifulSoup(r.text, "lxml")
    except Exception as e:
        log.warning(f"Fetch failed {url}: {e}")
        return None


def _meta_from_soup(soup: BeautifulSoup, url: str) -> dict:
    title_tag = (
        soup.find("meta", property="og:title")
        or soup.find("meta", {"name": "title"})
        or soup.find("h1")
        or soup.find("title")
    )
    title = (
        title_tag.get("content", "") if hasattr(title_tag, "get") else title_tag.get_text()
    ).strip() if title_tag else url[:80]

    desc_tag = (
        soup.find("meta", property="og:description")
        or soup.find("meta", {"name": "description"})
    )
    desc = desc_tag.get("content", "").strip() if desc_tag else ""

    body = soup.get_text(" ", strip=True)[:2000]
    dates = DATE_PATTERN.findall(body)
    deadline = dates[0][0] if dates else ""

    return {"title": title[:120], "description": desc[:300], "deadline": deadline}


def _scrape_edumap(seen: set) -> list[dict]:
    results = []
    # Kateqoriya səhifələrinin özlərini nəticəyə əlavə etməmək üçün
    for page_url in EDUMAP_PAGES:
        seen.add(page_url)
    for page_url in EDUMAP_PAGES:
        log.info(f"Edumap scraping: {page_url}")
        soup = _fetch_soup(page_url)
        if not soup:
            continue

        links = []
        for a in soup.find_all("a", href=True):
            href = a["href"]
            text = a.get_text(strip=True)
            if not text or len(text) < 8:
                continue
            # Yalnız məqalə linkləri (kateqoriya linkləri deyil)
            if href.startswith("/") and "/" not in href[1:]:
                full_url = "https://edumap.az" + href
                if full_url not in seen and _is_relevant(text):
                    links.append((full_url, text))

        for url, link_text in links:
            seen.add(url)
            article_soup = _fetch_soup(url)
            if not article_soup:
                meta = {"title": link_text[:120], "description": "", "deadline": ""}
            else:
                meta = _meta_from_soup(article_soup, url)
                if not meta["title"] or len(meta["title"]) < 5:
                    meta["title"] = link_text[:120]

            results.append({
                "title":       meta["title"],
                "url":         url,
                "description": meta["description"],
                "deadline":    meta["deadline"],
                "trusted":     True,
            })
            log.info(f"  + {meta['title'][:60]}")
            time.sleep(0.5)

    return results


def _scrape_ddg(seen: set) -> list[dict]:
    results = []
    for query in DDG_QUERIES:
        log.info(f"DDG: {query}")
        try:
            r = requests.get(
                "https://html.duckduckgo.com/html/",
                params={"q": query, "kl": "az-az"},
                headers=HEADERS,
                timeout=10,
            )
            soup = BeautifulSoup(r.text, "lxml")
            for a in soup.select("a.result__a")[:6]:
                href = a.get("href", "")
                if "uddg=" in href:
                    parsed = urlparse(href)
                    href = unquote(parse_qs(parsed.query).get("uddg", [""])[0])
                if not href.startswith("http") or href in seen:
                    continue
                seen.add(href)

                article_soup = _fetch_soup(href)
                if not article_soup:
                    continue
                meta = _meta_from_soup(article_soup, href)
                if not _is_relevant(meta["title"] + " " + meta["description"]):
                    continue

                results.append({
                    "title":       meta["title"] or href[:80],
                    "url":         href,
                    "description": meta["description"],
                    "deadline":    meta["deadline"],
                    "trusted":     False,
                })
                log.info(f"  + {results[-1]['title'][:60]}")
                time.sleep(1)
        except Exception as e:
            log.warning(f"DDG error for '{query}': {e}")
        time.sleep(2)

    return results


def scrape_hackathons() -> list[dict]:
    seen: set[str] = set()
    results = _scrape_edumap(seen)
    results += _scrape_ddg(seen)
    results.sort(key=lambda x: (not x["trusted"], x["title"]))
    log.info(f"Cəmi {len(results)} nəticə tapıldı.")
    return results
