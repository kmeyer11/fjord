from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from app import auth
from app.database import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])


class PinPayload(BaseModel):
    pin: str

    @field_validator("pin")
    @classmethod
    def validate_pin(cls, value: str) -> str:
        if not (4 <= len(value) <= 6) or not value.isdigit():
            raise ValueError("PIN must be 4-6 digits")
        return value


@router.get("/status")
def status(request: Request, db: Session = Depends(get_db)):
    config = auth.get_or_create_config(db)
    return {
        "pin_set": config.pin_hash is not None,
        "authenticated": auth.is_authenticated(request, config),
    }


@router.post("/login")
def login(payload: PinPayload, response: Response, db: Session = Depends(get_db)):
    config = auth.get_or_create_config(db)

    if config.pin_hash is None:
        config.pin_hash = auth.hash_pin(payload.pin)
        db.commit()
    elif not auth.verify_pin(payload.pin, config.pin_hash):
        raise HTTPException(status_code=401, detail="Incorrect PIN")

    token = auth.make_session_token(config.secret_key)
    response.set_cookie(
        auth.SESSION_COOKIE,
        token,
        max_age=auth.SESSION_MAX_AGE,
        httponly=True,
        samesite="lax",
    )
    return {"ok": True}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(auth.SESSION_COOKIE)
    return {"ok": True}


@router.get("/feed-token", dependencies=[Depends(auth.require_session)])
def feed_token(db: Session = Depends(get_db)):
    config = auth.get_or_create_config(db)
    return {"token": config.ics_token}


@router.post("/change-pin", dependencies=[Depends(auth.require_session)])
def change_pin(payload: PinPayload, db: Session = Depends(get_db)):
    config = auth.get_or_create_config(db)
    config.pin_hash = auth.hash_pin(payload.pin)
    db.commit()
    return {"ok": True}
