import hashlib
import hmac
import secrets
import time
from base64 import urlsafe_b64decode, urlsafe_b64encode

from fastapi import HTTPException, Request

from app import config_store
from app.config_store import AppSecrets

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


def make_session_token(session_secret: str) -> str:
    payload = str(int(time.time())).encode()
    sig = hmac.new(session_secret.encode(), payload, hashlib.sha256).digest()
    return f"{urlsafe_b64encode(payload).decode()}.{urlsafe_b64encode(sig).decode()}"


def verify_session_token(token: str, session_secret: str) -> bool:
    try:
        payload_b64, sig_b64 = token.split(".")
        payload = urlsafe_b64decode(payload_b64.encode())
        sig = urlsafe_b64decode(sig_b64.encode())
        expected_sig = hmac.new(session_secret.encode(), payload, hashlib.sha256).digest()
        if not hmac.compare_digest(sig, expected_sig):
            return False
        issued_at = int(payload.decode())
        return (time.time() - issued_at) < SESSION_MAX_AGE
    except (ValueError, UnicodeDecodeError):
        return False


def is_authenticated(request: Request, app_secrets: AppSecrets) -> bool:
    if app_secrets.pin_hash is None:
        return True  # no PIN set yet — first-run/setup state, app is open
    token = request.cookies.get(SESSION_COOKIE)
    return token is not None and verify_session_token(token, app_secrets.session_secret)


def require_session(request: Request) -> None:
    if not is_authenticated(request, config_store.load()):
        raise HTTPException(status_code=401, detail="Not authenticated")
