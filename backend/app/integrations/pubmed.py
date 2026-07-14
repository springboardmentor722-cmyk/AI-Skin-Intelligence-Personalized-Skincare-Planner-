# source: docs/DATASETS_AND_APIS.md → "8. Research" / PubMed
"""Free `esearch`/`efetch` against NCBI's E-utilities — no key required (NCBI_API_KEY
is optional, only raises the rate limit 3 -> 10 req/s). Unlike DermNet/AAD (marked
"copyrighted, do not ingest full articles" in the doc), PubMed abstracts are
explicitly sanctioned for storage — this fetches title/abstract/PMID/link, not full
article text (PubMed doesn't serve full text for most records anyway)."""

import xml.etree.ElementTree as ET
from dataclasses import dataclass

import httpx

from app.core.config import settings
from app.integrations.base import AdapterError, CircuitBreaker, call_with_resilience

source = "pubmed"
_ESEARCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
_EFETCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
_breaker = CircuitBreaker()


@dataclass
class PubMedArticle:
    pmid: str
    title: str
    abstract: str
    published_at: str | None  # ISO date string when parseable, else None


def _extract_article(article_el: ET.Element) -> PubMedArticle | None:
    pmid_el = article_el.find(".//PMID")
    title_el = article_el.find(".//ArticleTitle")
    if pmid_el is None or pmid_el.text is None or title_el is None:
        return None

    abstract_parts = [
        (node.text or "") for node in article_el.findall(".//AbstractText")
    ]
    abstract = " ".join(part.strip() for part in abstract_parts if part.strip())

    year_el = article_el.find(".//PubDate/Year")
    month_el = article_el.find(".//PubDate/Month")
    day_el = article_el.find(".//PubDate/Day")
    published_at = None
    if year_el is not None and year_el.text:
        month = (month_el.text if month_el is not None else None) or "01"
        day = (day_el.text if day_el is not None else None) or "01"
        month_num = _MONTHS.get(month, month if month.isdigit() else "01")
        published_at = f"{year_el.text}-{month_num.zfill(2)}-{day.zfill(2)}"

    return PubMedArticle(
        pmid=pmid_el.text,
        title="".join(title_el.itertext()),
        abstract=abstract,
        published_at=published_at,
    )


_MONTHS = {
    "Jan": "01",
    "Feb": "02",
    "Mar": "03",
    "Apr": "04",
    "May": "05",
    "Jun": "06",
    "Jul": "07",
    "Aug": "08",
    "Sep": "09",
    "Oct": "10",
    "Nov": "11",
    "Dec": "12",
}


async def search_and_fetch(query: str, max_results: int = 5) -> list[PubMedArticle]:
    """esearch for PMIDs matching `query`, then efetch the full records. Returns []
    on any resilience-exhausted failure rather than raising — a batch ingestion job
    (docs/DATASETS_AND_APIS.md: "product/ingredient ingests are batch jobs") should
    skip a failed topic and continue, not abort the whole run."""

    async def _call() -> list[PubMedArticle]:
        params: dict[str, str | int] = {}
        if settings.ncbi_api_key:
            params["api_key"] = settings.ncbi_api_key

        async with httpx.AsyncClient() as client:
            search_resp = await client.get(
                _ESEARCH_URL,
                params={
                    "db": "pubmed",
                    "term": query,
                    "retmode": "json",
                    "retmax": max_results,
                    **params,
                },
            )
            search_resp.raise_for_status()
            pmids = search_resp.json()["esearchresult"].get("idlist", [])
            if not pmids:
                return []

            fetch_resp = await client.get(
                _EFETCH_URL,
                params={"db": "pubmed", "id": ",".join(pmids), "retmode": "xml", **params},
            )
            fetch_resp.raise_for_status()
            root = ET.fromstring(fetch_resp.text)

        articles = []
        for article_el in root.findall(".//PubmedArticle"):
            article = _extract_article(article_el)
            if article is not None:
                articles.append(article)
        return articles

    try:
        result: list[PubMedArticle] = await call_with_resilience(_call, breaker=_breaker)
        return result
    except AdapterError:
        return []
