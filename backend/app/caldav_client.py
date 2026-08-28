"""Inbound Apple Calendar sync: read-only CalDAV polling against iCloud.

CalDAV has no push/webhook, so results are cached briefly and re-fetched on
the next request past the TTL — this is the "poll periodically / on-demand
refresh" behavior the spec calls for, without needing a background scheduler.
"""

import logging
import time
from datetime import date, datetime

import caldav

from app.config import settings

logger = logging.getLogger(__name__)

_CACHE_TTL_SECONDS = 120
_cache: dict[tuple[str, str], tuple[float, list[dict]]] = {}
_last_error: str | None = None
_last_synced_at: datetime | None = None


def is_configured() -> bool:
    return bool(settings.icloud_username and settings.icloud_app_password)


def sync_status() -> dict:
    return {
        "configured": is_configured(),
        "last_synced_at": _last_synced_at.isoformat() if _last_synced_at else None,
        "last_error": _last_error,
    }


def fetch_events(start: datetime, end: datetime, force: bool = False) -> list[dict]:
    global _last_error, _last_synced_at

    if not is_configured():
        return []

    cache_key = (start.isoformat(), end.isoformat())
    if not force and cache_key in _cache:
        cached_at, events = _cache[cache_key]
        if time.time() - cached_at < _CACHE_TTL_SECONDS:
            return events

    try:
        client = caldav.DAVClient(
            url=settings.caldav_url,
            username=settings.icloud_username,
            password=settings.icloud_app_password,
        )
        principal = client.principal()
        events: list[dict] = []
        for calendar in principal.calendars():
            for result in calendar.search(start=start, end=end, event=True, expand=True):
                vevent = result.icalendar_component
                dtstart = vevent["dtstart"].dt
                dtend_prop = vevent.get("dtend")
                dtend = dtend_prop.dt if dtend_prop else dtstart
                all_day = not isinstance(dtstart, datetime)
                events.append(
                    {
                        "id": str(vevent.get("uid", result.url)),
                        "calendar": str(calendar.name),
                        "title": str(vevent.get("summary", "Untitled")),
                        "start": _to_iso(dtstart),
                        "end": _to_iso(dtend),
                        "all_day": all_day,
                    }
                )
        _cache[cache_key] = (time.time(), events)
        _last_error = None
        _last_synced_at = datetime.utcnow()
        return events
    except Exception as exc:  # noqa: BLE001 - CalDAV/network failures are broad and non-fatal for a read-only sync
        logger.warning("CalDAV fetch failed: %s", exc)
        _last_error = str(exc)
        return []


def _to_iso(value: datetime | date) -> str:
    if isinstance(value, datetime):
        return value.isoformat()
    return datetime(value.year, value.month, value.day).isoformat()
