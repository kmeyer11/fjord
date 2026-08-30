"""Inbound Apple Calendar sync: read-only CalDAV polling against iCloud.

CalDAV has no push/webhook, so results are cached briefly and re-fetched on
the next request past the TTL — this is the "poll periodically / on-demand
refresh" behavior the spec calls for, without needing a background scheduler.

Credentials come from the local secrets store (set via the Settings page,
app password encrypted — see app.secrets_store) if present, else from
environment variables (see app.config) for headless/automated deployment.
"""

import logging
import re
import time
from datetime import date, datetime

import caldav
from caldav.elements import ical

from app import config_store, secrets_store
from app.config import settings

logger = logging.getLogger(__name__)

_CACHE_TTL_SECONDS = 120
_cache: dict[tuple[str, str], tuple[float, list[dict]]] = {}
_last_error: str | None = None
_last_synced_at: datetime | None = None


def get_credentials() -> tuple[str, str] | None:
    app_secrets = config_store.load()
    if app_secrets.icloud_username and app_secrets.icloud_app_password_enc:
        password = secrets_store.decrypt(app_secrets.icloud_app_password_enc)
        if password is not None:
            return app_secrets.icloud_username, password
    if settings.icloud_username and settings.icloud_app_password:
        return settings.icloud_username, settings.icloud_app_password
    return None


def is_configured() -> bool:
    return get_credentials() is not None


def sync_status() -> dict:
    creds = get_credentials()
    return {
        "configured": creds is not None,
        "icloud_username": creds[0] if creds else None,
        "last_synced_at": _last_synced_at.isoformat() if _last_synced_at else None,
        "last_error": _last_error,
    }


def test_connection(username: str, password: str) -> str | None:
    """Attempts to authenticate and list calendars. Returns an error message, or None on success."""
    try:
        client = caldav.DAVClient(url=settings.caldav_url, username=username, password=password)
        principal = client.principal()
        principal.calendars()
        return None
    except Exception as exc:  # noqa: BLE001 - surfacing whatever caldav/requests raises to the user
        return str(exc)


_HEX_COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$")


def _normalize_color(value: str | None) -> str | None:
    """Apple publishes calendar-color as #RRGGBB or #RRGGBBAA — drop any
    alpha channel so it's a plain CSS hex color, or None if absent/unparseable."""
    if not value or not _HEX_COLOR_RE.match(value):
        return None
    return value[:7].lower()


def fetch_events(start: datetime, end: datetime, force: bool = False) -> list[dict]:
    global _last_error, _last_synced_at

    creds = get_credentials()
    if creds is None:
        return []
    username, password = creds

    cache_key = (start.isoformat(), end.isoformat())
    if not force and cache_key in _cache:
        cached_at, events = _cache[cache_key]
        if time.time() - cached_at < _CACHE_TTL_SECONDS:
            return events

    try:
        client = caldav.DAVClient(url=settings.caldav_url, username=username, password=password)
        principal = client.principal()
        events: list[dict] = []
        for calendar in principal.calendars():
            # One extra property fetch per calendar (not per event) — cheap, and
            # covered by the same cache/TTL as the events themselves. Not every
            # CalDAV server implements this (non-standard) property, so a
            # failure here shouldn't take down the whole sync — just that
            # calendar's color.
            try:
                calendar_color = _normalize_color(calendar.get_property(ical.CalendarColor()))
            except Exception:  # noqa: BLE001 - best-effort; events still render without a color
                calendar_color = None
            for result in calendar.search(start=start, end=end, event=True, expand=True):
                vevent = result.icalendar_component
                dtstart = vevent["dtstart"].dt
                dtend_prop = vevent.get("dtend")
                dtend = dtend_prop.dt if dtend_prop else dtstart
                all_day = not isinstance(dtstart, datetime)
                location = vevent.get("location")
                description = vevent.get("description")
                events.append(
                    {
                        "id": str(vevent.get("uid", result.url)),
                        "calendar": str(calendar.name),
                        "calendar_color": calendar_color,
                        "title": str(vevent.get("summary", "Untitled")),
                        "start": _to_iso(dtstart),
                        "end": _to_iso(dtend),
                        "all_day": all_day,
                        "location": str(location) if location else None,
                        "description": str(description) if description else None,
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
