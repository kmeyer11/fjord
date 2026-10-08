from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, HTTPException

from app import caldav_client, calendar_push, config_store, secrets_store
from app.schemas import CalendarInfo, ExternalEvent, ICloudCredentials, TargetCalendarUpdate

router = APIRouter(prefix="/api/calendar", tags=["calendar"])


@router.get("/external-events", response_model=list[ExternalEvent])
def list_external_events(start: datetime, end: datetime, force: bool = False):
    return caldav_client.fetch_events(start, end, force=force)


@router.get("/status")
def calendar_status():
    return {**caldav_client.sync_status(), **calendar_push.status()}


@router.get("/calendars", response_model=list[CalendarInfo])
def list_calendars():
    try:
        return caldav_client.list_calendars()
    except Exception as exc:  # noqa: BLE001 - surfacing whatever caldav/requests raises to the user
        raise HTTPException(status_code=502, detail=f"Couldn't load calendars: {exc}")


@router.put("/target")
def set_target_calendar(payload: TargetCalendarUpdate, background_tasks: BackgroundTasks):
    """Picks the calendar Fjord writes its meetings into. Filling it (and
    clearing Fjord's events out of the previous one) happens in the
    background — it's one request per meeting."""
    name = None
    if payload.url is not None:
        match = next((c for c in list_calendars() if c["url"] == payload.url), None)
        if match is None:
            raise HTTPException(status_code=404, detail="Calendar not found")
        name = match["name"]

    app_secrets = config_store.load()
    old_url = app_secrets.icloud_calendar_url
    app_secrets.icloud_calendar_url = payload.url
    app_secrets.icloud_calendar_name = name
    config_store.save(app_secrets)

    background_tasks.add_task(calendar_push.change_target, old_url, payload.url)
    return calendar_push.status()


@router.post("/push")
def push_now():
    """Rewrites every meeting in the target calendar — the manual fix-up for
    edits made to Fjord's events directly in Apple Calendar, or writes that
    failed while iCloud was unreachable."""
    calendar_push.sync(push_all=True)
    return calendar_push.status()


@router.post("/icloud-credentials")
def connect_icloud(payload: ICloudCredentials):
    error = caldav_client.test_connection(payload.username, payload.app_password)
    if error:
        raise HTTPException(status_code=400, detail=f"Couldn't connect: {error}")

    app_secrets = config_store.load()
    app_secrets.icloud_username = payload.username
    app_secrets.icloud_app_password_enc = secrets_store.encrypt(payload.app_password)
    config_store.save(app_secrets)
    return {"ok": True}


@router.delete("/icloud-credentials")
def disconnect_icloud():
    # Fjord's events are left in the target calendar — without credentials
    # there's no way to remove them afterwards, and silently deleting them
    # here would be a surprise.
    app_secrets = config_store.load()
    app_secrets.icloud_username = None
    app_secrets.icloud_app_password_enc = None
    app_secrets.icloud_calendar_url = None
    app_secrets.icloud_calendar_name = None
    config_store.save(app_secrets)
    return {"ok": True}
