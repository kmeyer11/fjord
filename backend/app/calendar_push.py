"""Outbound Apple Calendar sync: writes Fjord's meetings into a calendar the
user picks on the Settings page (e.g. their existing "Arbejde" calendar),
over the same iCloud CalDAV connection caldav_client reads from.

Fjord's database stays the source of truth — this only mirrors it. Each
meeting is stored at a predictable resource name (fjord-task-<id>.ics), so a
sync can tell Fjord's events apart from everything else in the calendar from
a single PROPFIND listing, without downloading any event data:

- meetings with no resource yet are created,
- resources with no meeting behind them anymore are deleted,
- meetings whose content changed (passed in as `changed_ids`) are rewritten.

Events the user created themselves in that calendar are never touched.
Like the rest of the CalDAV integration this runs on demand rather than on a
timer: every meeting write in routers/tasks.py schedules a sync as a FastAPI
background task, so the UI never waits on iCloud.
"""

import logging
import threading
from collections.abc import Iterable
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

import caldav
from icalendar import Calendar, Event
from sqlalchemy.orm import Session

from app import caldav_client, config_store, models
from app.config import settings
from app.database import SessionLocal

logger = logging.getLogger(__name__)

_LOCAL_TZ = ZoneInfo(settings.local_timezone)

# Tasks don't carry a duration, so each gets a fixed-length block — long
# enough to be visible in the calendar, short enough not to visually overlap
# the next one.
_EVENT_DURATION = timedelta(minutes=30)

_RESOURCE_PREFIX = "fjord-task-"

# Syncs run in FastAPI's threadpool, and several can be queued by a burst of
# edits. Serializing them means each one reads the database fresh once it
# gets the lock, so the last sync to run always leaves the calendar matching
# the latest state.
_lock = threading.Lock()

# Meetings whose last write failed (e.g. iCloud was unreachable), retried on
# the next sync. In memory only — a restart drops it, and the next full push
# (picking the calendar again, or "Refresh now") catches anything missed.
_pending_ids: set[int] = set()
_full_push_pending = False
_last_error: str | None = None
_last_synced_at: datetime | None = None


def _uid(task_id: int) -> str:
    """Event UID for a task. The inbound sync recognizes Fjord's own events
    by its prefix (see caldav_client.is_fjord_event)."""
    return f"{_RESOURCE_PREFIX}{task_id}@fjord.local"


def _published_meetings(db: Session) -> list[models.Task]:
    """Meetings that belong on a calendar: scheduled, dated, not done."""
    return (
        db.query(models.Task)
        .filter(
            models.Task.status == models.TaskStatus.in_progress,
            models.Task.due_at.isnot(None),
            models.Task.category == models.TaskCategory.meeting,
        )
        .all()
    )


def _task_event(task: models.Task) -> Event:
    event = Event()
    event.add("uid", _uid(task.id))
    event.add("summary", task.title)
    if task.all_day:
        # A date (not datetime) value is written as VALUE=DATE, which is
        # what makes calendars show it as all-day. Taken in local time
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
    return event


def _task_ics(task: models.Task) -> bytes:
    cal = Calendar()
    cal.add("prodid", "-//Fjord//calendar-push//EN")
    cal.add("version", "2.0")
    cal.add_component(_task_event(task))
    return cal.to_ical()


def target_calendar() -> dict | None:
    app_secrets = config_store.load()
    if not app_secrets.icloud_calendar_url:
        return None
    return {"url": app_secrets.icloud_calendar_url, "name": app_secrets.icloud_calendar_name}


def status() -> dict:
    return {
        "target_calendar": target_calendar(),
        "last_pushed_at": _last_synced_at.isoformat() if _last_synced_at else None,
        "last_push_error": _last_error,
    }


def _open_calendar(url: str) -> caldav.Calendar | None:
    creds = caldav_client.get_credentials()
    if creds is None:
        return None
    username, password = creds
    client = caldav.DAVClient(url=settings.caldav_url, username=username, password=password)
    return client.calendar(url=url)


def _fjord_resources(calendar: caldav.Calendar) -> dict[int, str]:
    """task id -> resource URL for every Fjord-written event in the calendar."""
    resources: dict[int, str] = {}
    for url, _types, _name in calendar.children():
        filename = str(url).rstrip("/").rsplit("/", 1)[-1]
        if not (filename.startswith(_RESOURCE_PREFIX) and filename.endswith(".ics")):
            continue
        task_id = filename[len(_RESOURCE_PREFIX) : -len(".ics")]
        if task_id.isdigit():
            resources[int(task_id)] = str(url)
    return resources


def _put(calendar: caldav.Calendar, task: models.Task) -> None:
    url = str(calendar.url.join(f"{_RESOURCE_PREFIX}{task.id}.ics"))
    response = calendar.client.put(url, _task_ics(task), {"Content-Type": "text/calendar; charset=utf-8"})
    if response.status not in (200, 201, 204):
        raise RuntimeError(f"Couldn't save '{task.title}' to the calendar ({response.status} {response.reason})")


def _delete(calendar: caldav.Calendar, url: str) -> None:
    response = calendar.client.delete(url)
    # 404: already gone, which is what we wanted anyway.
    if response.status not in (200, 204, 404):
        raise RuntimeError(f"Couldn't remove an event from the calendar ({response.status} {response.reason})")


def sync(changed_ids: Iterable[int] = (), push_all: bool = False) -> None:
    """Brings the target calendar in line with Fjord's meetings. Safe to call
    when no target calendar is set (does nothing). Never raises — failures are
    recorded for the Settings page and retried on the next sync."""
    global _last_error, _last_synced_at, _full_push_pending

    with _lock:
        target = target_calendar()
        if target is None:
            return
        _pending_ids.update(changed_ids)
        push_all = push_all or _full_push_pending
        db = SessionLocal()
        try:
            calendar = _open_calendar(target["url"])
            if calendar is None:
                return
            meetings = {task.id: task for task in _published_meetings(db)}
            existing = _fjord_resources(calendar)

            for task_id, url in existing.items():
                if task_id not in meetings:
                    _delete(calendar, url)
                    _pending_ids.discard(task_id)
            for task_id, task in meetings.items():
                if push_all or task_id not in existing or task_id in _pending_ids:
                    _put(calendar, task)
                    _pending_ids.discard(task_id)
            _pending_ids.intersection_update(meetings)

            _full_push_pending = False
            _last_error = None
            _last_synced_at = datetime.now(timezone.utc)
        except Exception as exc:  # noqa: BLE001 - CalDAV/network failures are broad; surfaced on the Settings page
            logger.warning("Calendar push failed: %s", exc)
            _last_error = str(exc)
            _full_push_pending = push_all
        finally:
            db.close()


def has_pending() -> bool:
    return bool(_pending_ids) or _full_push_pending


def remove_all(calendar_url: str) -> None:
    """Deletes every Fjord-written event from a calendar — used when the user
    switches to a different target, so the old one isn't left with a frozen
    copy of their meetings."""
    global _last_error

    with _lock:
        try:
            calendar = _open_calendar(calendar_url)
            if calendar is None:
                return
            for url in _fjord_resources(calendar).values():
                _delete(calendar, url)
        except Exception as exc:  # noqa: BLE001 - see sync()
            logger.warning("Removing Fjord events from %s failed: %s", calendar_url, exc)
            _last_error = str(exc)


def change_target(old_url: str | None, new_url: str | None) -> None:
    """Background job for switching target calendars: clear out the old one,
    then fill the new one."""
    global _full_push_pending

    _pending_ids.clear()
    _full_push_pending = False
    if old_url and old_url != new_url:
        remove_all(old_url)
    if new_url:
        sync(push_all=True)
