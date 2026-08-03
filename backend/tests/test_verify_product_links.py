"""backend/app/services/admin/ingest/verify_product_links.py's pure
classification logic - the actual HTTP calls are mocked, this tests how results
get turned into the two CSV row lists."""

from app.services.admin.ingest.verify_product_links import classify_check_results


def test_classify_check_results_separates_broken_from_ok() -> None:
    results = [
        ("https://example.com/ok.jpg", 200),
        ("https://example.com/missing.jpg", 404),
        ("https://example.com/error.jpg", None),  # request raised, no status code
    ]

    broken = classify_check_results(results)

    assert broken == [
        ("https://example.com/missing.jpg", 404),
        ("https://example.com/error.jpg", "request failed"),
    ]


def test_classify_check_results_returns_empty_when_all_ok() -> None:
    results = [("https://example.com/a.jpg", 200), ("https://example.com/b.jpg", 301)]

    assert classify_check_results(results) == []


def test_classify_check_results_treats_skipped_non_http_url_as_not_broken() -> None:
    # A non-HTTP(S) URL (e.g. an S3 key) is pre-filtered before any request is made
    # and must not be counted alongside a genuine request failure (both used to
    # collapse to (url, None) -> "request failed").
    results: list[tuple[str, int | str | None]] = [
        ("s3://bucket/key.jpg", "skipped"),
        ("https://example.com/error.jpg", None),  # request raised, no status code
    ]

    broken = classify_check_results(results)

    assert broken == [("https://example.com/error.jpg", "request failed")]
