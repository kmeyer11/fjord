from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, field_validator

from app import auth, config_store

router = APIRouter(prefix="/api/auth", tags=["auth"])


class PinPayload(BaseModel):
    pin: str

    @field_validator("pin")
    @classmethod
    def validate_pin(cls, value: str) -> str:
        if len(value) != 4 or not value.isdigit():
            raise ValueError("PIN must be 4 digits")
        return value


@router.get("/status")
def status(request: Request):
    app_secrets = config_store.load()
    return {
        "pin_set": app_secrets.pin_hash is not None,
        "authenticated": auth.is_authenticated(request, app_secrets),
    }


@router.post("/login")
def login(payload: PinPayload, request: Request, response: Response):
    client_ip = request.client.host if request.client else "unknown"
    retry_after = auth.login_retry_after(client_ip)
    if retry_after is not None:
        raise HTTPException(
            status_code=429,
            detail="Too many attempts",
            headers={"Retry-After": str(retry_after)},
        )

    app_secrets = config_store.load()

    if app_secrets.pin_hash is None:
        app_secrets.pin_hash = auth.hash_pin(payload.pin)
        config_store.save(app_secrets)
    elif not auth.verify_pin(payload.pin, app_secrets.pin_hash):
        auth.record_failed_login(client_ip)
        raise HTTPException(status_code=401, detail="Incorrect PIN")

    auth.reset_login_attempts(client_ip)
    auth.set_session_cookie(response, app_secrets.session_secret)
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
