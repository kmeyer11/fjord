import hashlib
import hmac
import secrets
import time
from base64 import urlsafe_b64decode, urlsafe_b64encode

from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AppConfig

SESSION_COOKIE = "fjord_session"
SESSION_MAX_AGE = 60 * 60 * 24 * 30  # 30 days — this is a "keep out casual snoopers" gate, not a bank
PBKDF2_ITERATIONS = 200_000


def hash_pin(pin: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", pin.encode(), bytes.fromhex(salt), PBKDF2_ITERATIONS).hex()
    return f"{salt}${digest}"


def verify_pin(pin: str, stored: str) -> bool:
    salt, digest = stored.split("$")
    candidate = hashlib.pbkdf2_hmac("sha256", pin.encode(), bytes.fromhex(salt), PBKDF2_ITERATIONS).hex()
    return hmac.compare_digest(candidate, digest)


def get_or_create_config(db: Session) -> AppConfig:
    config = db.get(AppConfig, 1)
    if config is None:
        config = AppConfig(id=1, secret_key=secrets.token_urlsafe(32), ics_token=secrets.token_urlsafe(24))
        db.add(config)
        db.commit()
        db.refresh(config)
    return config


def make_session_token(secret_key: str) -> str:
    payload = str(int(time.time())).encode()
    sig = hmac.new(secret_key.encode(), payload, hashlib.sha256).digest()
    return f"{urlsafe_b64encode(payload).decode()}.{urlsafe_b64encode(sig).decode()}"


def verify_session_token(token: str, secret_key: str) -> bool:
    try:
        payload_b64, sig_b64 = token.split(".")
        payload = urlsafe_b64decode(payload_b64.encode())
        sig = urlsafe_b64decode(sig_b64.encode())
        expected_sig = hmac.new(secret_key.encode(), payload, hashlib.sha256).digest()
        if not hmac.compare_digest(sig, expected_sig):
            return False
        issued_at = int(payload.decode())
        return (time.time() - issued_at) < SESSION_MAX_AGE
    except (ValueError, UnicodeDecodeError):
        return False


def is_authenticated(request: Request, config: AppConfig) -> bool:
    if config.pin_hash is None:
        return True  # no PIN set yet — first-run/setup state, app is open
    token = request.cookies.get(SESSION_COOKIE)
    return token is not None and verify_session_token(token, config.secret_key)


def require_session(request: Request, db: Session = Depends(get_db)) -> None:
    config = get_or_create_config(db)
    if not is_authenticated(request, config):
        raise HTTPException(status_code=401, detail="Not authenticated")
