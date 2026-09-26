"""Generate (or rotate) the long-lived API token used by programmatic
clients, e.g. the MCP server (see repo root README's "MCP integration
(Claude)" section).

    cd backend && .venv/bin/python -m app.generate_api_token

Prints the new token once — it's stored (in app/config_store.AppSecrets,
same file as the other secrets) but never displayed again, so copy it
wherever the client reads FJORD_API_TOKEN from. Running this again replaces
the old token, so any client already configured with it will need updating.
"""

import secrets

from app import config_store


def main() -> None:
    app_secrets = config_store.load()
    app_secrets.api_token = secrets.token_urlsafe(32)
    config_store.save(app_secrets)
    print(app_secrets.api_token)


if __name__ == "__main__":
    main()
