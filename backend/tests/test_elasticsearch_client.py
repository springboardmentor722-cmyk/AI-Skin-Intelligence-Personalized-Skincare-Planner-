"""app/db/elasticsearch.py — lazy, health-checked ES client (M3-A). Only
app/worker/ is ever supposed to write through this (ADR-005 single-writer rule);
this module itself just exposes the client + a health check."""

from app.db.elasticsearch import get_elasticsearch, is_elasticsearch_available


async def test_get_elasticsearch_returns_the_same_client_instance() -> None:
    assert get_elasticsearch() is get_elasticsearch()


async def test_is_elasticsearch_available_against_the_live_docker_cluster() -> None:
    assert await is_elasticsearch_available() is True
