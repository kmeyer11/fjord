from datetime import datetime

from fastapi import APIRouter

from app import caldav_client
from app.schemas import ExternalEvent

router = APIRouter(prefix="/api/calendar", tags=["calendar"])


@router.get("/external-events", response_model=list[ExternalEvent])
def list_external_events(start: datetime, end: datetime, force: bool = False):
    return caldav_client.fetch_events(start, end, force=force)


@router.get("/status")
def calendar_status():
    return caldav_client.sync_status()
