import datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.trend import RealProgressTrendAnalyzer
from app.core.storage import (
    FileValidationError,
    build_key,
    get_presigned_url,
    sniff_content_type,
    strip_exif,
    upload,
)
from app.services.progress.models import ProgressImage
from app.services.progress.schemas import (
    AdherenceDay,
    CompliancePercentages,
    ConcernChangeRead,
    Milestone,
    ProgressLogRead,
    ProgressPhotoRead,
    ProgressPhotosRead,
    ProgressSummaryRead,
    ScoreTrendPoint,
    TrendInsightRead,
)
from app.services.routines import service as routines_service
from app.services.scores import service as scores_service
from app.services.skin_profile import service as skin_profile_service

_PROGRESS_PHOTO_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
_LOW_CONFIDENCE_THRESHOLD = 0.6  # milestone_3.md §8's own UI-warning threshold
_STREAK_MILESTONE_DAYS = (7, 14, 30)
_trend_analyzer = RealProgressTrendAnalyzer()


# --- Photos (PG progress_images + S3-compatible storage) ---


async def upload_progress_photo(
    db: AsyncSession,
    user_id: str,
    data: bytes,
    filename: str,
    tag: str | None = None,
) -> ProgressImage:
    """EXIF stripped before it ever reaches storage. `tag` defaults to
    "Baseline" for a user's first-ever photo, "Week N" (computed from
    weeks-since-baseline) for subsequent ones - a caller-supplied tag always
    wins. `skin_health_score_at_upload` is read from the scores service
    interface once, at upload time, and never recomputed - a later score
    change must not retroactively rewrite what this photo's caption claimed."""
    sniffed = sniff_content_type(data)
    if sniffed is None or sniffed not in _PROGRESS_PHOTO_CONTENT_TYPES:
        raise FileValidationError("Unsupported file type")
    stripped = strip_exif(data, sniffed)

    key = build_key(prefix="progress-photos", owner_user_id=user_id, filename=filename)
    await upload(key, stripped, allowed_content_types=_PROGRESS_PHOTO_CONTENT_TYPES)

    existing_photos = await list_progress_photos(db, user_id)
    if tag is not None:
        resolved_tag = tag
    elif not existing_photos:
        resolved_tag = "Baseline"
    else:
        # server_default=func.now() means uploaded_at is always set post-insert;
        # the fallback only satisfies the type checker, never actually hit (same
        # pattern as get_progress_photos below).
        baseline_date = (
            existing_photos[0].uploaded_at or datetime.datetime.now(datetime.UTC)
        ).date()
        days_since_baseline = (datetime.datetime.now(datetime.UTC).date() - baseline_date).days
        weeks_since_baseline = max(1, days_since_baseline // 7)
        resolved_tag = f"Week {weeks_since_baseline}"

    latest_score = await scores_service.get_latest_score(db, user_id)
    score_at_upload = (
        float(latest_score.overall_score)
        if latest_score and latest_score.overall_score is not None
        else None
    )

    image = ProgressImage(
        user_id=user_id,
        image_url=key,
        image_stage=resolved_tag,
        skin_health_score_at_upload=score_at_upload,
    )
    db.add(image)
    await db.commit()
    await db.refresh(image)
    return image


async def list_progress_photos(db: AsyncSession, user_id: str) -> list[ProgressImage]:
    result = await db.execute(
        select(ProgressImage)
        .where(ProgressImage.user_id == user_id)
        .order_by(ProgressImage.uploaded_at.asc())
    )
    return list(result.scalars().all())


async def get_progress_photos(db: AsyncSession, user_id: str) -> ProgressPhotosRead:
    """Before/after (milestone_3.md's own acceptance criterion) is the oldest vs
    the most recent uploaded photo — matching the wireframe's simple "OCT 12 ->
    TODAY" comparison, not a stage the user has to tag per upload."""
    photos = await list_progress_photos(db, user_id)
    reads = [
        ProgressPhotoRead(
            progress_image_id=photo.progress_image_id,
            image_stage=photo.image_stage,
            # server_default=func.now() means this is always set post-insert; the
            # fallback only satisfies the type checker, never actually hit.
            uploaded_at=photo.uploaded_at or datetime.datetime.now(datetime.UTC),
            skin_health_score_at_upload=photo.skin_health_score_at_upload,
            url=await get_presigned_url(photo.image_url) if photo.image_url else "",
        )
        for photo in photos
    ]
    before = reads[0] if reads else None
    after = reads[-1] if len(reads) > 1 else None
    return ProgressPhotosRead(photos=reads, before=before, after=after)


# --- Adherence series (routine_logs, via the routines service interface) ---


async def get_adherence_series(
    db: AsyncSession, user_id: str, days: int = 30
) -> list[AdherenceDay]:
    today = datetime.datetime.now(datetime.UTC).date()
    all_days = [today - datetime.timedelta(days=offset) for offset in range(days - 1, -1, -1)]
    assigned_by_day = await routines_service.list_historical_active_step_ids(db, user_id, all_days)
    logs = await routines_service.list_recent_routine_logs(user_id, days=days)
    logs_by_date = {log["log_date"].date(): log for log in logs}

    series: list[AdherenceDay] = []
    for day in all_days:
        assigned_ids = assigned_by_day.get(day, set())
        if not assigned_ids:
            # Omit entirely rather than fabricating a 0% - matches
            # get_compliance_percentages' treatment of zero-assigned days, and
            # keeps `[]` as the honest "no routine ever assigned" empty state
            # the frontend (web/app/(user)/progress/page.tsx) branches on.
            continue
        log = logs_by_date.get(day)
        completed = (
            sum(
                1
                for entry in log.get("completed_steps", [])
                if entry.get("routine_step_id") in assigned_ids
            )
            if log
            else 0
        )
        ratio = min(1.0, completed / len(assigned_ids))
        series.append(AdherenceDay(date=day, completed_ratio=ratio))
    return series


_COMPLIANCE_WINDOWS = (7, 30, 90)


async def get_compliance_percentages(db: AsyncSession, user_id: str) -> CompliancePercentages:
    """7/30/90-day aggregate compliance on top of the same historically-corrected
    per-day assignment `get_adherence_series` uses — completed/assigned steps,
    summed across each window's days. Zero-assigned days are excluded from BOTH
    sides of the ratio (not just the numerator), so a user with no routine ever
    assigned gets an honest `None`, never a fabricated 0%."""
    max_days = max(_COMPLIANCE_WINDOWS)
    today = datetime.datetime.now(datetime.UTC).date()
    all_days = [today - datetime.timedelta(days=offset) for offset in range(max_days - 1, -1, -1)]
    assigned_by_day = await routines_service.list_historical_active_step_ids(db, user_id, all_days)
    logs = await routines_service.list_recent_routine_logs(user_id, days=max_days)
    logs_by_date = {log["log_date"].date(): log for log in logs}

    completed_by_day: dict[datetime.date, int] = {}
    for day in all_days:
        assigned_ids = assigned_by_day.get(day, set())
        log = logs_by_date.get(day)
        completed_by_day[day] = (
            sum(
                1
                for entry in log.get("completed_steps", [])
                if entry.get("routine_step_id") in assigned_ids
            )
            if log and assigned_ids
            else 0
        )

    percentages: dict[str, float | None] = {}
    field_by_window = {7: "seven_day", 30: "thirty_day", 90: "ninety_day"}
    for window in _COMPLIANCE_WINDOWS:
        window_days = all_days[-window:]
        total_assigned = sum(len(assigned_by_day.get(d, set())) for d in window_days)
        total_completed = sum(completed_by_day.get(d, 0) for d in window_days)
        percentages[field_by_window[window]] = (
            round(total_completed / total_assigned, 4) if total_assigned > 0 else None
        )
    return CompliancePercentages(**percentages)


# --- Milestone detection (streaks, score-band crossings) — pure functions ---


def _detect_streak_milestones(adherence: list[AdherenceDay]) -> list[Milestone]:
    streak = 0
    milestones: list[Milestone] = []
    # `adherence` omits days with nothing assigned (get_adherence_series), so a
    # streak only counts consecutive *assigned* days at 100% - a day nothing was
    # assignable is absent rather than present-with-zero, so it can't wrongly
    # break a streak.
    for day in adherence:  # ascending
        streak = streak + 1 if day.completed_ratio >= 1.0 else 0
        if streak in _STREAK_MILESTONE_DAYS:
            milestones.append(Milestone(label=f"{streak}-day routine streak", achieved_on=day.date))
    return milestones


def _detect_score_band_milestones(points: list[ScoreTrendPoint]) -> list[Milestone]:
    milestones: list[Milestone] = []
    for prev, curr in zip(points, points[1:], strict=False):
        if prev.overall_score is None or curr.overall_score is None:
            continue
        prev_band = int(prev.overall_score // 10)
        curr_band = int(curr.overall_score // 10)
        if curr_band > prev_band:
            milestones.append(
                Milestone(label=f"Score crossed into the {curr_band * 10}s", achieved_on=curr.date)
            )
    return milestones


# --- Weekly progress log (Mongo progress_logs, schema #3 — first real writer) ---


async def _compute_concern_changes(db: AsyncSession, user_id: str) -> list[ConcernChangeRead]:
    """Compares the *oldest* and *current* saved profile versions — real
    severity_rating deltas, empty (not fabricated) until a user has saved a
    profile more than once."""
    history = await skin_profile_service.list_profile_history(db, user_id)
    if len(history) < 2:
        return []
    oldest, current = history[0], history[-1]
    all_concerns = await skin_profile_service.list_skin_concerns(db)
    concern_names = {c.concern_id: c.concern_name for c in all_concerns}
    before_by_concern = {
        c.concern_id: c.severity_rating for c in oldest.concerns if c.severity_rating is not None
    }
    after_by_concern = {
        c.concern_id: c.severity_rating for c in current.concerns if c.severity_rating is not None
    }
    shared = set(before_by_concern) & set(after_by_concern)
    return [
        ConcernChangeRead(
            concern=concern_names[cid] or str(cid),
            before=before_by_concern[cid],
            after=after_by_concern[cid],
        )
        for cid in shared
        if cid in concern_names and before_by_concern[cid] != after_by_concern[cid]
    ]


async def upsert_progress_log(
    db: AsyncSession, mongo: Any, user_id: str, notes: str | None
) -> ProgressLogRead:
    """One doc per (user_id, week_number) — the schema's own documented unique
    index. Every field except `notes` is computed here from real data, never
    user-supplied (schemas.py's `ProgressLogCreate` docstring). Known limitation,
    inherited from the documented schema rather than silently patched: `week_number`
    alone isn't year-scoped, so the same ISO week in a later year collides with
    this year's — flagged in PROGRESS.md, not fixed here without an owner-approved
    schema change."""
    now = datetime.datetime.now(datetime.UTC)
    week_number = now.isocalendar().week

    photos = await list_progress_photos(db, user_id)
    before_photo = photos[0] if photos else None
    after_photo = photos[-1] if len(photos) > 1 else None

    scores = await scores_service.get_recent_scores(db, user_id, days=90)
    scored_points = [
        (score.calculated_at.date(), float(score.overall_score))
        for score in scores
        if score.calculated_at is not None and score.overall_score is not None
    ]
    improvement_score = (
        round(scored_points[-1][1] - scored_points[0][1], 2) if len(scored_points) >= 2 else None
    )

    trend_summary = None
    insight = _trend_analyzer.analyze(scored_points)
    if insight is not None and insight.confidence >= _LOW_CONFIDENCE_THRESHOLD:
        trend_summary = insight.summary

    concern_changes = await _compute_concern_changes(db, user_id)

    before_url = (
        await get_presigned_url(before_photo.image_url)
        if before_photo and before_photo.image_url
        else None
    )
    after_url = (
        await get_presigned_url(after_photo.image_url)
        if after_photo and after_photo.image_url
        else None
    )

    document = {
        "user_id": user_id,
        "week_number": week_number,
        "before_image": before_photo.image_url if before_photo else None,
        "after_image": after_photo.image_url if after_photo else None,
        "improvement_score": improvement_score,
        "concern_changes": [c.model_dump() for c in concern_changes],
        "trend_summary": trend_summary,
        "notes": notes,
        "created_at": now,
    }
    await mongo["progress_logs"].update_one(
        {"user_id": user_id, "week_number": week_number}, {"$set": document}, upsert=True
    )

    return ProgressLogRead(
        week_number=week_number,
        before_image_url=before_url,
        after_image_url=after_url,
        improvement_score=improvement_score,
        concern_changes=concern_changes,
        trend_summary=trend_summary,
        notes=notes,
        created_at=now,
    )


async def list_progress_logs(mongo: Any, user_id: str, limit: int = 12) -> list[dict[str, Any]]:
    cursor = mongo["progress_logs"].find({"user_id": user_id}).sort("week_number", -1).limit(limit)
    return [doc async for doc in cursor]


# --- Summary (existing M1 endpoint, contract kept additive) ---


async def get_progress_summary(
    db: AsyncSession, user_id: str, days: int = 30
) -> ProgressSummaryRead:
    """Minimal M1 slice (`points`) plus M3-E's real additions (`adherence`,
    `insight`, `milestones`) — same contract, richer payload
    (milestone_3.md §M3-E: "progress/me/summary unchanged", additive)."""
    scores = await scores_service.get_recent_scores(db, user_id, days=days)
    points = [
        ScoreTrendPoint(
            date=score.calculated_at.date() if score.calculated_at else datetime.date.today(),
            overall_score=score.overall_score,
        )
        for score in scores
    ]

    adherence = await get_adherence_series(db, user_id, days=days)

    insight = None
    scored_points = [(p.date, p.overall_score) for p in points if p.overall_score is not None]
    trend = _trend_analyzer.analyze(scored_points)
    if trend is not None:
        insight = TrendInsightRead(
            direction=trend.direction,
            magnitude=trend.magnitude,
            confidence=trend.confidence,
            summary=trend.summary,
            low_confidence=trend.confidence < _LOW_CONFIDENCE_THRESHOLD,
        )

    milestones = _detect_streak_milestones(adherence) + _detect_score_band_milestones(points)

    return ProgressSummaryRead(
        points=points, adherence=adherence, insight=insight, milestones=milestones
    )
