import hashlib
import hmac
import secrets
import time
from base64 import urlsafe_b64decode, urlsafe_b64encode
from dataclasses import dataclass

from fastapi import HTTPException, Request, Response

from app import config_store
from app.config_store import AppSecrets

SESSION_COOKIE = "fjord_session"
SESSION_MAX_AGE = 60 * 60 * 2  # 2 hours of inactivity — this is a "keep out casual snoopers" gate, not a bank
SESSION_REFRESH_AFTER = 60 * 30  # reissue the cookie once it's this old, instead of on every single request
PBKDF2_ITERATIONS = 200_000

# A 4-digit PIN only has 10,000 combinations, so brute force has to be made
# slow rather than just detected. Two free typos, then escalating lockouts
# per IP — by the 8th wrong guess in a row you're waiting 15 minutes, which
# puts an exhaustive search years out of reach. Kept in memory (not on disk):
# it resets on a server restart, which is an acceptable trade-off for a
# single-process personal app and avoids an ever-growing file of IPs.
LOGIN_FAIL_THRESHOLD = 3  # wrong PINs allowed before lockout kicks in
LOGIN_LOCKOUT_BASE = 30  # seconds, lockout on the threshold-th failure
LOGIN_LOCKOUT_MAX = 15 * 60  # cap so the wait never grows past this


@dataclass
class _LoginAttempts:
    fail_count: int = 0
    locked_until: float = 0.0


_login_attempts: dict[str, _LoginAttempts] = {}


def login_retry_after(client_ip: str) -> int | None:
    """Seconds until `client_ip` may attempt another login, or None if it's allowed now."""
    attempts = _login_attempts.get(client_ip)
    if attempts is None:
        return None
    remaining = attempts.locked_until - time.time()
    return round(remaining) if remaining > 0 else None


def record_failed_login(client_ip: str) -> None:
    attempts = _login_attempts.setdefault(client_ip, _LoginAttempts())
    attempts.fail_count += 1
    if attempts.fail_count >= LOGIN_FAIL_THRESHOLD:
        backoff = LOGIN_LOCKOUT_BASE * 2 ** (attempts.fail_count - LOGIN_FAIL_THRESHOLD)
        attempts.locked_until = time.time() + min(backoff, LOGIN_LOCKOUT_MAX)


def reset_login_attempts(client_ip: str) -> None:
    _login_attempts.pop(client_ip, None)


def set_session_cookie(response: Response, session_secret: str) -> None:
    response.set_cookie(
        SESSION_COOKIE,
        make_session_token(session_secret),
        max_age=SESSION_MAX_AGE,
        httponly=True,
        samesite="lax",
    )


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


def decode_session_token(token: str, session_secret: str) -> int | None:
    """Returns the token's issued-at unix timestamp if its signature is valid, else None."""
    try:
        payload_b64, sig_b64 = token.split(".")
        payload = urlsafe_b64decode(payload_b64.encode())
        sig = urlsafe_b64decode(sig_b64.encode())
        expected_sig = hmac.new(session_secret.encode(), payload, hashlib.sha256).digest()
        if not hmac.compare_digest(sig, expected_sig):
            return None
        return int(payload.decode())
    except (ValueError, UnicodeDecodeError):
        return None


def verify_session_token(token: str, session_secret: str) -> bool:
    issued_at = decode_session_token(token, session_secret)
    return issued_at is not None and (time.time() - issued_at) < SESSION_MAX_AGE


def is_authenticated(request: Request, app_secrets: AppSecrets) -> bool:
    if app_secrets.pin_hash is None:
        return True  # no PIN set yet — first-run/setup state, app is open
    token = request.cookies.get(SESSION_COOKIE)
    return token is not None and verify_session_token(token, app_secrets.session_secret)


def require_session(request: Request, response: Response) -> None:
    app_secrets = config_store.load()
    if not is_authenticated(request, app_secrets):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = request.cookies.get(SESSION_COOKIE)
    issued_at = decode_session_token(token, app_secrets.session_secret) if token else None
    if issued_at is not None and (time.time() - issued_at) > SESSION_REFRESH_AFTER:
        set_session_cookie(response, app_secrets.session_secret)


def require_session_or_api_token(request: Request, response: Response) -> None:
    """Same gate as require_session, but also accepts a long-lived
    `Authorization: Bearer <api_token>` header — for programmatic clients
    (e.g. the MCP server) that can't do a browser-style PIN login/cookie
    refresh. The bearer path skips the cookie-refresh side effect below since
    there's no cookie to refresh."""
    auth_header = request.headers.get("authorization", "")
    if auth_header.lower().startswith("bearer "):
        app_secrets = config_store.load()
        candidate = auth_header[len("bearer ") :].strip()
        if app_secrets.api_token and hmac.compare_digest(candidate, app_secrets.api_token):
            return
        raise HTTPException(status_code=401, detail="Invalid API token")

    require_session(request, response)
