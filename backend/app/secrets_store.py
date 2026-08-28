"""Encrypts secrets (the iCloud app password) before they're stored in the
database. The key lives in its own local file rather than a DB column or
this repo, so a copy of the database alone doesn't carry what's needed to
decrypt it — see config.credentials_key_path.
"""

import os
from functools import lru_cache

from cryptography.fernet import Fernet, InvalidToken

from app.config import settings


@lru_cache(maxsize=1)
def _fernet() -> Fernet:
    path = settings.credentials_key_path
    if path.is_file():
        key = path.read_bytes()
    else:
        key = Fernet.generate_key()
        path.write_bytes(key)
        os.chmod(path, 0o600)
    return Fernet(key)


def encrypt(plaintext: str) -> str:
    return _fernet().encrypt(plaintext.encode()).decode()


def decrypt(ciphertext: str) -> str | None:
    try:
        return _fernet().decrypt(ciphertext.encode()).decode()
    except InvalidToken:
        return None
