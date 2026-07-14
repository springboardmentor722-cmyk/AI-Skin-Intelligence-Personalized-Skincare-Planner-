"""Real PubMed ingestion — `make ingest-knowledge` / `python -m app.db.ingest_knowledge`.

Unlike Kaggle (products) or OpenWeather/OpenUV, PubMed's E-utilities need no API key
at all (NCBI_API_KEY only raises the rate limit) — this is fully real and runnable
today, not a credential-blocked pipeline. One query per real seeded skin_concerns
name (not an invented topic list), via integrations/pubmed.py's esearch/efetch,
upserted into Mongo `knowledge_articles`
(database_schemas/skinlytics_mongodb_schema_v3.txt #6) keyed by the real PMID as
`article_id` — idempotent, safe to re-run.
"""

import asyncio
import datetime

from app.db.mongo import get_mongo_db
from app.db.postgres import async_session_factory
from app.integrations.pubmed import search_and_fetch
from app.services.skin_profile import service as skin_profile_service

_COLLECTION = "knowledge_articles"
_ARTICLES_PER_CONCERN = 3


async def ingest_for_concern(concern_name: str) -> int:
    articles = await search_and_fetch(
        f"{concern_name} skincare treatment", max_results=_ARTICLES_PER_CONCERN
    )
    if not articles:
        return 0

    collection = get_mongo_db()[_COLLECTION]
    upserted = 0
    for article in articles:
        article_id = int(article.pmid)
        published_at = (
            datetime.datetime.strptime(article.published_at, "%Y-%m-%d").replace(
                tzinfo=datetime.UTC
            )
            if article.published_at
            else None
        )
        # A real article can legitimately match more than one concern query (e.g. a
        # hyperpigmentation article surfaces under both "Dark Spots" and "Uneven Skin
        # Tone") — found live, not by inspection: an earlier version's plain `$set`
        # on tags/related_conditions silently overwrote the prior concern's tag
        # instead of accumulating it. `$addToSet`/`$each` merges instead.
        result = await collection.update_one(
            {"article_id": article_id},
            {
                "$set": {
                    "article_id": article_id,
                    "title": article.title,
                    "source": "pubmed",
                    "summary": article.abstract[:280],
                    "content": article.abstract,
                    "related_ingredients": [],
                    "embedding_id": f"article_{article_id}",
                    "published_at": published_at,
                    "created_at": datetime.datetime.now(datetime.UTC),
                    # License ledger (docs/DATASETS_AND_APIS.md): PubMed abstracts are
                    # explicitly sanctioned for storage, unlike DermNet/AAD's
                    # copyrighted full text.
                    "license": "PubMed abstract (NCBI, public metadata)",
                    "source_url": f"https://pubmed.ncbi.nlm.nih.gov/{article.pmid}/",
                },
                "$addToSet": {
                    "tags": concern_name,
                    "related_conditions": concern_name,
                },
                "$setOnInsert": {"first_ingested_at": datetime.datetime.now(datetime.UTC)},
            },
            upsert=True,
        )
        if result.upserted_id is not None or result.modified_count > 0:
            upserted += 1
    return upserted


async def main() -> None:
    async with async_session_factory() as db:
        concerns = await skin_profile_service.list_skin_concerns(db)

    if not concerns:
        print("No seeded skin_concerns found — nothing to search for.")
        return

    total = 0
    for concern in concerns:
        if not concern.concern_name:
            continue
        count = await ingest_for_concern(concern.concern_name)
        print(f"{concern.concern_name}: {count} article(s) upserted")
        total += count
    print(f"Done. {total} article(s) upserted across {len(concerns)} concern(s).")


if __name__ == "__main__":
    asyncio.run(main())
