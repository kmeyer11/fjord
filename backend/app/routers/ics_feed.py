from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from icalendar import Calendar, Event
from sqlalchemy.orm import Session

from app import auth, models
from app.database import get_db

router = APIRouter(tags=["ics-feed"])

# Scheduled tasks don't carry a duration, so each gets a fixed-length block on
# the published feed — long enough to be visible on a subscribed calendar,
# short enough not to visually overlap the next scheduled task.
_EVENT_DURATION = timedelta(minutes=30)


@router.get("/calendar/fjord.ics")
def fjord_ics_feed(token: str, db: Session = Depends(get_db)):
    config = auth.get_or_create_config(db)
    if token != config.ics_token:
        raise HTTPException(status_code=403, detail="Invalid feed token")

    cal = Calendar()
    cal.add("prodid", "-//Fjord//fjord.ics//EN")
    cal.add("version", "2.0")
    cal.add("x-wr-calname", "Fjord")
    cal.add("x-published-ttl", "PT1H")

    tasks = (
        db.query(models.Task)
        .filter(models.Task.status == models.TaskStatus.scheduled, models.Task.due_at.isnot(None))
        .all()
    )
    for task in tasks:
        event = Event()
        event.add("uid", f"fjord-task-{task.id}@fjord.local")
        event.add("summary", task.title)
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
