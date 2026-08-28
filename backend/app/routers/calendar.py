from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import auth, caldav_client, secrets_store
from app.database import get_db
from app.schemas import ExternalEvent, ICloudCredentials

router = APIRouter(prefix="/api/calendar", tags=["calendar"])


@router.get("/external-events", response_model=list[ExternalEvent])
def list_external_events(start: datetime, end: datetime, force: bool = False, db: Session = Depends(get_db)):
    return caldav_client.fetch_events(db, start, end, force=force)


@router.get("/status")
def calendar_status(db: Session = Depends(get_db)):
    return caldav_client.sync_status(db)


@router.post("/icloud-credentials")
def connect_icloud(payload: ICloudCredentials, db: Session = Depends(get_db)):
    error = caldav_client.test_connection(payload.username, payload.app_password)
    if error:
        raise HTTPException(status_code=400, detail=f"Couldn't connect: {error}")

    config = auth.get_or_create_config(db)
    config.icloud_username = payload.username
    config.icloud_app_password_enc = secrets_store.encrypt(payload.app_password)
    db.commit()
    return {"ok": True}


@router.delete("/icloud-credentials")
def disconnect_icloud(db: Session = Depends(get_db)):
    config = auth.get_or_create_config(db)
    config.icloud_username = None
    config.icloud_app_password_enc = None
    db.commit()
    return {"ok": True}
