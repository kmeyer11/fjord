"""Local, file-based store for security-sensitive app state — PIN hash,
session-signing secret, .ics feed token, iCloud credentials (app password
encrypted, see app.secrets_store).

Deliberately kept out of fjord.db, which holds only your projects and
tasks. If that database is ever backed up, exported, or copied elsewhere,
it doesn't carry the session secret (which alone would let someone forge a
login) or your iCloud credentials. This file needs its own care instead —
it's not meant to travel with your project data.
"""

import json
import os
import secrets
from dataclasses import asdict, dataclass

from app.config import settings


@dataclass
class AppSecrets:
    session_secret: str
    ics_token: str
    pin_hash: str | None = None
    icloud_username: str | None = None
    icloud_app_password_enc: str | None = None


def load() -> AppSecrets:
    path = settings.secrets_path
    if path.is_file():
        return AppSecrets(**json.loads(path.read_text()))
    fresh = AppSecrets(session_secret=secrets.token_urlsafe(32), ics_token=secrets.token_urlsafe(24))
    save(fresh)
    return fresh


def save(app_secrets: AppSecrets) -> None:
    path = settings.secrets_path
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(asdict(app_secrets), indent=2))
    os.chmod(tmp, 0o600)
    tmp.replace(path)  # atomic on POSIX — no risk of a corrupt half-written file
