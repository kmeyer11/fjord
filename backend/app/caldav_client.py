"""Inbound Apple Calendar sync: read-only CalDAV polling against iCloud.

CalDAV has no push/webhook, so results are cached briefly and re-fetched on
the next request past the TTL — this is the "poll periodically / on-demand
refresh" behavior the spec calls for, without needing a background scheduler.

Credentials come from the local secrets store (set via the Settings page,
app password encrypted — see app.secrets_store) if present, else from
environment variables (see app.config) for headless/automated deployment.
"""

import logging
import time
from datetime import date, datetime

import caldav

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
