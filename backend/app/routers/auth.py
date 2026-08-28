from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, field_validator

from app import auth, config_store

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
def status(request: Request):
    app_secrets = config_store.load()
    return {
        "pin_set": app_secrets.pin_hash is not None,
        "authenticated": auth.is_authenticated(request, app_secrets),
    }


@router.post("/login")
def login(payload: PinPayload, response: Response):
    app_secrets = config_store.load()

    if app_secrets.pin_hash is None:
        app_secrets.pin_hash = auth.hash_pin(payload.pin)
        config_store.save(app_secrets)
    elif not auth.verify_pin(payload.pin, app_secrets.pin_hash):
        raise HTTPException(status_code=401, detail="Incorrect PIN")

    token = auth.make_session_token(app_secrets.session_secret)
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
def feed_token():
    return {"token": config_store.load().ics_token}


@router.post("/change-pin", dependencies=[Depends(auth.require_session)])
def change_pin(payload: PinPayload):
    app_secrets = config_store.load()
    app_secrets.pin_hash = auth.hash_pin(payload.pin)
    config_store.save(app_secrets)
    return {"ok": True}
