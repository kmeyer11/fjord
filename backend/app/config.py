from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """Runtime configuration, overridable via environment variables or a .env file.

    Host binding defaults to 0.0.0.0 (not localhost) so the app is reachable from
    other devices on the local network per the Fjord spec's phone-access requirement.
    """

    model_config = SettingsConfigDict(env_prefix="FJORD_", env_file=".env", extra="ignore")

    database_url: str = f"sqlite:///{BACKEND_DIR / 'fjord.db'}"
    host: str = "0.0.0.0"
    port: int = 8000
    frontend_dist_dir: Path = BACKEND_DIR.parent / "frontend" / "dist"

    # iCloud CalDAV (inbound, read-only). Generate an app-specific password at
    # appleid.apple.com — never use the main Apple ID password here. Leave unset
    # to run with Apple Calendar sync disabled.
    icloud_username: str | None = None
    icloud_app_password: str | None = None
    caldav_url: str = "https://caldav.icloud.com"


settings = Settings()
