from datetime import datetime

from fastapi import APIRouter, HTTPException

from app import caldav_client, config_store, secrets_store
from app.schemas import ExternalEvent, ICloudCredentials

router = APIRouter(prefix="/api/calendar", tags=["calendar"])


@router.get("/external-events", response_model=list[ExternalEvent])
def list_external_events(start: datetime, end: datetime, force: bool = False):
    return caldav_client.fetch_events(start, end, force=force)


@router.get("/status")
def calendar_status():
    return caldav_client.sync_status()


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
    app_secrets = config_store.load()
    app_secrets.icloud_username = None
    app_secrets.icloud_app_password_enc = None
    config_store.save(app_secrets)
    return {"ok": True}
