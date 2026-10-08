from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from icalendar import Calendar
from sqlalchemy.orm import Session

from app import calendar_push, config_store
from app.database import get_db

router = APIRouter(tags=["ics-feed"])


@router.get("/calendar/fjord.ics")
def fjord_ics_feed(token: str, db: Session = Depends(get_db)):
    """Read-only subscription feed of Fjord's meetings. Superseded by writing
    straight into a calendar of the user's choice (app.calendar_push), but
    kept so an existing subscription doesn't start failing; both use the same
    event builder, so they never disagree."""
    if token != config_store.load().ics_token:
        raise HTTPException(status_code=403, detail="Invalid feed token")

    cal = Calendar()
    cal.add("prodid", "-//Fjord//fjord.ics//EN")
    cal.add("version", "2.0")
    cal.add("x-wr-calname", "Fjord")
    cal.add("x-published-ttl", "PT1H")
    for task in calendar_push.published_meetings(db):
        cal.add_component(calendar_push.task_event(task))

    return Response(
        content=cal.to_ical(),
        media_type="text/calendar",
        headers={"Content-Disposition": 'inline; filename="fjord.ics"'},
    )
