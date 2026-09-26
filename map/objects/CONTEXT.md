# Objects — the nouns

One card per noun, clustered by how you'd actually ask about it, not by source folder. Check `_index.md` first — it tells you whether a card has a real body yet (`verified`) or is just a stub.

## Clusters

| Cluster | Covers |
|---|---|
| `core/` | `Project`, `Task` — the two DB models everything else hangs off |
| `calendar-sync/` | inbound CalDAV polling from iCloud, outbound `.ics` export |
| `auth-and-secrets/` | PIN/session auth, API bearer tokens, encrypted secrets & config store |
| `mcp-surface/` | the standalone MCP server exposing the backend as tools |
| `frontend/` | the API client contract, board UI, calendar UI |

Card status `verified` means: dated, cites a branch/commit, and the claims were re-checked against source before being marked done (see root `CONTEXT.md` for the audit date/branch).
