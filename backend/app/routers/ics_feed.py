from datetime import timedelta
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from icalendar import Calendar, Event
from sqlalchemy.orm import Session

from app import config_store, models
from app.config import settings
from app.database import get_db

router = APIRouter(tags=["ics-feed"])

_LOCAL_TZ = ZoneInfo(settings.local_timezone)

# Tasks don't carry a duration, so each gets a fixed-length block on the
# published feed — long enough to be visible on a subscribed calendar, short
# enough not to visually overlap the next one.
_EVENT_DURATION = timedelta(minutes=30)

def _uid(task_id: int) -> str:
    return f"fjord-task-{task_id}@fjord.local"


@router.get("/calendar/fjord.ics")
def fjord_ics_feed(token: str, db: Session = Depends(get_db)):
    if token != config_store.load().ics_token:
        raise HTTPException(status_code=403, detail="Invalid feed token")

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
        if task.all_day:
            # A date (not datetime) value is written as VALUE=DATE, which is
            # what makes subscribers show it as all-day. Taken in local time
            # since all-day meetings are stored as local midnight in UTC.
            day = task.due_at.astimezone(_LOCAL_TZ).date()
            event.add("dtstart", day)
            event.add("dtend", day + timedelta(days=1))
        else:
            event.add("dtstart", task.due_at)
            event.add("dtend", task.due_at + _EVENT_DURATION)
        event.add("dtstamp", task.updated_at)
        if task.description:
            event.add("description", task.description)
        cal.add_component(event)

    return Response(
        content=cal.to_ical(),
        media_type="text/calendar",
        headers={"Content-Disposition": 'inline; filename="fjord.ics"'},
    )
