import uuid
from datetime import datetime, timedelta, timezone
from typing import Literal
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models, schemas
from app.config import settings
from app.database import get_db

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

# How far ahead a recurring series is kept populated with real Task rows. Chosen
# to comfortably cover the calendar's month view (never more than ~6 weeks
# visible) with headroom, while keeping the series' row count bounded.
_RECURRENCE_HORIZON = timedelta(weeks=12)

_LOCAL_TZ = ZoneInfo(settings.local_timezone)


def _next_week(value: datetime) -> datetime:
    """Steps one week ahead in local wall-clock time, not absolute UTC time —
    so "every Tuesday at 10" stays at 10 local across a DST change instead of
    drifting an hour."""
    local = (value.astimezone(_LOCAL_TZ) + timedelta(weeks=1)).astimezone(timezone.utc)
    return local


def _next_occurrence(weekday: int, time_str: str, after: datetime) -> datetime:
    """Nearest datetime on `weekday` (0=Monday..6=Sunday) at `time_str`
    ("HH:MM") that is at/after `after`, computed in local wall-clock time
    (see _next_week) so a shifted series lands on the intended weekday
    regardless of DST. Returned in UTC."""
    hour, minute = (int(part) for part in time_str.split(":"))
    local_after = after.astimezone(_LOCAL_TZ)
    days_ahead = (weekday - local_after.weekday()) % 7
    candidate = (local_after + timedelta(days=days_ahead)).replace(hour=hour, minute=minute, second=0, microsecond=0)
    if candidate < local_after:
        candidate += timedelta(weeks=1)
    return candidate.astimezone(timezone.utc)


def _get_task_or_404(task_id: int, db: Session) -> models.Task:
    task = db.get(models.Task, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


def _generate_following_occurrences(
    db: Session, template: models.Task, recurrence_id: str, horizon: datetime
) -> None:
    """Adds weekly occurrences after template.due_at (exclusive) up to horizon,
    cloning template's title/description/criticality/all_day."""
    next_due_at = _next_week(template.due_at)
    while next_due_at <= horizon:
        db.add(
            models.Task(
                project_id=None,
                title=template.title,
                description=template.description,
                category=models.TaskCategory.meeting,
                status=models.TaskStatus.in_progress,
                criticality=template.criticality,
                due_at=next_due_at,
                all_day=template.all_day,
                recurrence_id=recurrence_id,
            )
        )
        next_due_at = _next_week(next_due_at)


def _delete_tasks(db: Session, tasks: list[models.Task]) -> None:
    """Deletes tasks, first recording a TaskTombstone for any that were on the
    published .ics feed (same filter as ics_feed.py), so the feed can publish
    an explicit cancellation instead of the meeting silently disappearing."""
    for task in tasks:
        if (
            task.category == models.TaskCategory.meeting
            and task.status == models.TaskStatus.in_progress
            and task.due_at is not None
        ):
            db.merge(models.TaskTombstone(task_id=task.id, title=task.title, due_at=task.due_at))
        db.delete(task)


def _stop_series(db: Session, recurrence_id: str) -> None:
    """Detaches every remaining row of a series from recurrence_id. Needed
    whenever a series is shortened (future occurrences dropped) — otherwise
    _extend_recurring_series would just see the remaining earlier occurrences
    and regenerate the dropped ones right back on the next read."""
    db.query(models.Task).filter(models.Task.recurrence_id == recurrence_id).update(
        {"recurrence_id": None}, synchronize_session=False
    )


def _extend_recurring_series(db: Session) -> None:
    """Tops up every recurring series so it has occurrences generated out to
    the horizon. CalDAV has no push either (see caldav_client), so both use
    the same trick: extend lazily on the next read rather than needing a
    background scheduler."""
    horizon = datetime.now(timezone.utc) + _RECURRENCE_HORIZON
    series = (
        db.query(models.Task.recurrence_id, func.max(models.Task.due_at))
        .filter(models.Task.recurrence_id.isnot(None))
        .group_by(models.Task.recurrence_id)
        .all()
    )
    dirty = False
    for recurrence_id, latest_due_at in series:
        if latest_due_at is None or latest_due_at >= horizon:
            continue
        template = (
            db.query(models.Task)
            .filter(models.Task.recurrence_id == recurrence_id, models.Task.due_at == latest_due_at)
            .first()
        )
        if template is None:
            continue
        _generate_following_occurrences(db, template, recurrence_id, horizon)
        dirty = True
    if dirty:
        db.commit()


@router.get("", response_model=list[schemas.Task])
def list_tasks(status: models.TaskStatus | None = None, db: Session = Depends(get_db)):
    """All tasks across every project — the calendar view needs a cross-project
    list of meetings, unlike the per-project listing under /api/projects."""
    _extend_recurring_series(db)
    query = db.query(models.Task)
    if status is not None:
        query = query.filter(models.Task.status == status)
    return query.order_by(models.Task.id).all()


@router.post("", response_model=schemas.Task, status_code=201)
def create_meeting(payload: schemas.MeetingCreate, db: Session = Depends(get_db)):
    """Meetings are project-less tasks, so unlike regular tasks (created via
    POST /api/projects/{project_id}/tasks) they get a standalone route here."""
    recurrence_id = str(uuid.uuid4()) if payload.recurring else None
    task = models.Task(
        project_id=None,
        title=payload.title,
        description=payload.description,
        category=models.TaskCategory.meeting,
        status=models.TaskStatus.in_progress,
        criticality=3,
        due_at=payload.due_at,
        all_day=payload.all_day,
        recurrence_id=recurrence_id,
    )
    db.add(task)

    if recurrence_id is not None:
        horizon = datetime.now(timezone.utc) + _RECURRENCE_HORIZON
        _generate_following_occurrences(db, task, recurrence_id, horizon)

    db.commit()
    db.refresh(task)
    return task


@router.get("/{task_id}", response_model=schemas.Task)
def get_task(task_id: int, db: Session = Depends(get_db)):
    return _get_task_or_404(task_id, db)


@router.patch("/{task_id}", response_model=schemas.Task)
def update_task(task_id: int, payload: schemas.TaskUpdate, db: Session = Depends(get_db)):
    task = _get_task_or_404(task_id, db)
    updates = payload.model_dump(exclude_unset=True)
    if "project_id" in updates and db.get(models.Project, updates["project_id"]) is None:
        raise HTTPException(status_code=404, detail="Project not found")
    recurring = updates.pop("recurring", None)
    new_status = updates.pop("status", None)
    for field, value in updates.items():
        setattr(task, field, value)

    if new_status is not None and new_status != task.status:
        # Stamp/clear completed_at so the board knows how long it's sat in
        # Done and can auto-archive it later (see ARCHIVE_AFTER in projects.py).
        task.completed_at = datetime.now(timezone.utc) if new_status == models.TaskStatus.done else None
        task.status = new_status

    if recurring is True and task.recurrence_id is None:
        if task.due_at is None:
            raise HTTPException(status_code=400, detail="A meeting needs a date to repeat")
        task.recurrence_id = str(uuid.uuid4())
        horizon = datetime.now(timezone.utc) + _RECURRENCE_HORIZON
        _generate_following_occurrences(db, task, task.recurrence_id, horizon)
    elif recurring is False and task.recurrence_id is not None:
        # Drop the rest of the series from here on and detach every remaining
        # row (including past occurrences) — see _stop_series.
        old_recurrence_id = task.recurrence_id
        _delete_tasks(
            db,
            db.query(models.Task)
            .filter(
                models.Task.recurrence_id == old_recurrence_id,
                models.Task.id != task.id,
                models.Task.due_at > task.due_at,
            )
            .all(),
        )
        _stop_series(db, old_recurrence_id)

    db.commit()
    db.refresh(task)
    return task


@router.patch("/series/{recurrence_id}", response_model=list[schemas.Task])
def update_meeting_series(recurrence_id: str, payload: schemas.SeriesUpdate, db: Session = Depends(get_db)):
    """Reschedules an entire recurring series to a new weekday/time (and
    optionally title/all_day). Not-yet-occurred rows are replaced by a fresh
    run generated from the new schedule; past rows are left as history."""
    rows = db.query(models.Task).filter(models.Task.recurrence_id == recurrence_id).all()
    if not rows:
        raise HTTPException(status_code=404, detail="Series not found")

    now = datetime.now(timezone.utc)
    template_source = max(rows, key=lambda r: r.due_at)
    title = payload.title if payload.title is not None else template_source.title
    all_day = payload.all_day if payload.all_day is not None else template_source.all_day

    _delete_tasks(
        db,
        db.query(models.Task).filter(models.Task.recurrence_id == recurrence_id, models.Task.due_at >= now).all(),
    )

    anchor = models.Task(
        project_id=None,
        title=title,
        description=template_source.description,
        category=models.TaskCategory.meeting,
        status=models.TaskStatus.in_progress,
        criticality=template_source.criticality,
        # All-day meetings are stored at local midnight (as the create modals
        # send them); the hidden time picker's stale value must not leak in.
        due_at=_next_occurrence(payload.weekday, "00:00" if all_day else payload.time, now),
        all_day=all_day,
        recurrence_id=recurrence_id,
    )
    db.add(anchor)
    _generate_following_occurrences(db, anchor, recurrence_id, now + _RECURRENCE_HORIZON)

    db.commit()
    return (
        db.query(models.Task)
        .filter(models.Task.recurrence_id == recurrence_id)
        .order_by(models.Task.due_at)
        .all()
    )


@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: int, scope: Literal["single", "future"] = "single", db: Session = Depends(get_db)):
    task = _get_task_or_404(task_id, db)
    if scope == "future" and task.recurrence_id is not None:
        recurrence_id = task.recurrence_id
        _delete_tasks(
            db,
            db.query(models.Task)
            .filter(models.Task.recurrence_id == recurrence_id, models.Task.due_at >= task.due_at)
            .all(),
        )
        _stop_series(db, recurrence_id)
    else:
        _delete_tasks(db, [task])
    db.commit()
