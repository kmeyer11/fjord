from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from icalendar import Calendar, Event
from sqlalchemy.orm import Session

from app import config_store, models
from app.database import get_db

router = APIRouter(tags=["ics-feed"])

# Tasks don't carry a duration, so each gets a fixed-length block on the
# published feed — long enough to be visible on a subscribed calendar, short
# enough not to visually overlap the next one.
_EVENT_DURATION = timedelta(minutes=30)

# How long a cancelled meeting keeps being republished as STATUS:CANCELLED
# after deletion. Needs to outlast the slowest subscriber's refresh interval
# (Google Calendar in particular can go the better part of a day between
# polls of a subscribed URL) — see TaskTombstone.
_TOMBSTONE_RETENTION = timedelta(days=3)


def _uid(task_id: int) -> str:
    return f"fjord-task-{task_id}@fjord.local"


@router.get("/calendar/fjord.ics")
def fjord_ics_feed(token: str, db: Session = Depends(get_db)):
    if token != config_store.load().ics_token:
        raise HTTPException(status_code=403, detail="Invalid feed token")

    db.query(models.TaskTombstone).filter(
        models.TaskTombstone.deleted_at < datetime.now(timezone.utc) - _TOMBSTONE_RETENTION
    ).delete(synchronize_session=False)
    db.commit()

    cal = Calendar()
    cal.add("prodid", "-//Fjord//fjord.ics//EN")
    cal.add("version", "2.0")
    cal.add("x-wr-calname", "Fjord")
    cal.add("x-published-ttl", "PT1H")

    tasks = (
        db.query(models.Task)
        .filter(
            models.Task.status == models.TaskStatus.in_progress,
            models.Task.due_at.isnot(None),
            models.Task.category == models.TaskCategory.meeting,
        )
        .all()
    )
    for task in tasks:
        event = Event()
        event.add("uid", _uid(task.id))
        event.add("summary", task.title)
        event.add("dtstart", task.due_at)
        event.add("dtend", task.due_at + _EVENT_DURATION)
        event.add("dtstamp", task.updated_at)
        if task.description:
            event.add("description", task.description)
        cal.add_component(event)

    # A deleted meeting just falls out of the query above — which isn't
    # enough on its own, since most calendar apps only add events they see
    # in a subscribed feed and never notice one that quietly stops
    # appearing. Publish an explicit cancellation instead. tasks.id isn't
    # AUTOINCREMENT, so SQLite can reuse a deleted id for a new row — skip
    # any tombstone whose id is live again, or it would cancel the new task.
    tombstones = (
        db.query(models.TaskTombstone)
        .filter(~models.TaskTombstone.task_id.in_(db.query(models.Task.id)))
        .all()
    )
    for tombstone in tombstones:
        event = Event()
        event.add("uid", _uid(tombstone.task_id))
        event.add("summary", tombstone.title)
        event.add("dtstart", tombstone.due_at)
        event.add("dtend", tombstone.due_at + _EVENT_DURATION)
        event.add("dtstamp", tombstone.deleted_at)
        event.add("sequence", 1)
        event.add("status", "CANCELLED")
        cal.add_component(event)

    return Response(
        content=cal.to_ical(),
        media_type="text/calendar",
        headers={"Content-Disposition": 'inline; filename="fjord.ics"'},
    )
