"""Local, file-based store for security-sensitive app state — PIN hash,
session-signing secret, iCloud credentials (app password
encrypted, see app.secrets_store) and the calendar Fjord writes into.

Deliberately kept out of fjord.db, which holds only your projects and
tasks. If that database is ever backed up, exported, or copied elsewhere,
it doesn't carry the session secret (which alone would let someone forge a
login) or your iCloud credentials. This file needs its own care instead —
it's not meant to travel with your project data.
"""

import json
import os
import secrets
from dataclasses import asdict, dataclass, fields

from app.config import settings


@dataclass
class AppSecrets:
    session_secret: str
    pin_hash: str | None = None
    icloud_username: str | None = None
    icloud_app_password_enc: str | None = None
    # The iCloud calendar Fjord writes its meetings into (see
    # app.calendar_push). The name is only for display on the Settings page.
    icloud_calendar_url: str | None = None
    icloud_calendar_name: str | None = None
    # Long-lived bearer token for programmatic clients (e.g. the MCP server) —
    # deliberately separate from the PIN/session-cookie flow, which is built
    # for a browser (short-lived, IP-lockout on guesses). None until generated
    # via `python -m app.generate_api_token`.
    api_token: str | None = None


def load() -> AppSecrets:
    path = settings.secrets_path
    if path.is_file():
        # Skip keys from older versions (e.g. the removed .ics feed token);
        # they're dropped from the file on the next save().
        known = {f.name for f in fields(AppSecrets)}
        stored = json.loads(path.read_text())
        return AppSecrets(**{key: value for key, value in stored.items() if key in known})
    fresh = AppSecrets(session_secret=secrets.token_urlsafe(32))
    save(fresh)
    return fresh


def save(app_secrets: AppSecrets) -> None:
    path = settings.secrets_path
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(asdict(app_secrets), indent=2))
    os.chmod(tmp, 0o600)
    tmp.replace(path)  # atomic on POSIX — no risk of a corrupt half-written file
