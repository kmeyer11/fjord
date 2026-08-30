#!/usr/bin/env bash
# Pulls a consistent, point-in-time copy of the live Fjord database out of the
# running Docker container, for local backend testing against real data.
#
# Uses SQLite's Online Backup API (via `sqlite3.Connection.backup`) rather than
# a raw file copy, so it's safe to run while the live container is serving
# traffic — it never opens the live file for writing and never blocks it for
# more than a moment. Secrets (PIN hash, iCloud credentials) are deliberately
# NOT copied, so the local backend starts with no PIN set.
#
# Usage: scripts/dev-snapshot-db.sh [container-name]
set -euo pipefail

CONTAINER="${1:-fjord-fjord-1}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST_DIR="$ROOT_DIR/backend/.dev-data"

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  echo "error: container '$CONTAINER' is not running (docker ps to check the name)" >&2
  exit 1
fi

mkdir -p "$DEST_DIR"

echo "Snapshotting $CONTAINER:/data/fjord.db..."
docker exec "$CONTAINER" python3 -c "
import sqlite3
src = sqlite3.connect('file:/data/fjord.db?mode=ro', uri=True)
dst = sqlite3.connect('/data/.dev_snapshot.db')
src.backup(dst)
dst.close()
src.close()
"
docker cp "$CONTAINER:/data/.dev_snapshot.db" "$DEST_DIR/fjord.db"
docker exec "$CONTAINER" rm -f /data/.dev_snapshot.db

ENV_FILE="$ROOT_DIR/backend/.env"
cat > "$ENV_FILE" <<EOF
FJORD_DATABASE_URL=sqlite:///$DEST_DIR/fjord.db
FJORD_SECRETS_PATH=$DEST_DIR/secrets.json
FJORD_CREDENTIALS_KEY_PATH=$DEST_DIR/credentials.key
EOF

# The live container may be a version or two behind this checkout's models —
# bring the snapshot up to the current code's schema so it's ready to run.
echo "Applying local migrations to the snapshot..."
( cd "$ROOT_DIR/backend" && alembic upgrade head )

echo "Snapshot ready at $DEST_DIR/fjord.db (wrote backend/.env to point at it)."
echo
echo "Run the backend:   cd backend && uvicorn app.main:app --reload --port 8001"
echo "Point the frontend: echo VITE_DEV_API_TARGET=http://127.0.0.1:8001 > frontend/.env.local"
echo "Then:               npm --prefix frontend run dev"
echo
echo "First backend start has no PIN set (secrets weren't copied) — pick any local-only PIN when prompted."
