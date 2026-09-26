import json

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/api/preferences", tags=["preferences"])


def _get(db: Session, key: str):
    row = db.get(models.AppSetting, key)
    return json.loads(row.value) if row else None


def _set(db: Session, key: str, value) -> None:
    row = db.get(models.AppSetting, key)
    if value is None:
        if row:
            db.delete(row)
        return
    if row:
        row.value = json.dumps(value)
    else:
        db.add(models.AppSetting(key=key, value=json.dumps(value)))


@router.get("", response_model=schemas.Preferences)
def get_preferences(db: Session = Depends(get_db)):
    return schemas.Preferences(scene=_get(db, "scene"))


@router.put("", response_model=schemas.Preferences)
def update_preferences(payload: schemas.Preferences, db: Session = Depends(get_db)):
    _set(db, "scene", payload.scene)
    db.commit()
    return schemas.Preferences(scene=_get(db, "scene"))
