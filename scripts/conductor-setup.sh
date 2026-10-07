#!/usr/bin/env bash
# Conductor setup script — runs once in each new workspace (a git worktree).
# Gives the workspace its own Python venv, node_modules, and SQLite database so
# parallel workspaces never share state. See .conductor/settings.toml.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."
WORKSPACE_DIR="$PWD"

# Node is installed via nvm, which non-interactive shells don't load by default.
if ! command -v npm >/dev/null 2>&1 && [ -s "$HOME/.nvm/nvm.sh" ]; then
  . "$HOME/.nvm/nvm.sh"
fi

echo "==> Backend: creating venv and installing requirements"
python3 -m venv backend/.venv
backend/.venv/bin/pip install --quiet --upgrade pip
backend/.venv/bin/pip install --quiet -r backend/requirements.txt

# Per-workspace data dir. If the main checkout has a snapshot of real data
# (from scripts/dev-snapshot-db.sh), start from a copy of it; otherwise the
# backend creates an empty database. Secrets are never copied, so each
# workspace starts with no PIN set.
DATA_DIR="$WORKSPACE_DIR/backend/.dev-data"
mkdir -p "$DATA_DIR"
SNAPSHOT="${CONDUCTOR_ROOT_PATH:-}/backend/.dev-data/fjord.db"
if [ -n "${CONDUCTOR_ROOT_PATH:-}" ] && [ -f "$SNAPSHOT" ] && [ ! -f "$DATA_DIR/fjord.db" ]; then
  echo "==> Copying data snapshot from main checkout"
  python3 -c "
import sqlite3, sys
src = sqlite3.connect('file:' + sys.argv[1] + '?mode=ro', uri=True)
dst = sqlite3.connect(sys.argv[2])
src.backup(dst)
dst.close(); src.close()
" "$SNAPSHOT" "$DATA_DIR/fjord.db"
fi

# Always (re)write backend/.env so it points at this workspace's own files —
# a copied-in .env from the main checkout would point at shared ones.
cat > backend/.env <<ENV
FJORD_DATABASE_URL=sqlite:///$DATA_DIR/fjord.db
FJORD_SECRETS_PATH=$DATA_DIR/secrets.json
FJORD_CREDENTIALS_KEY_PATH=$DATA_DIR/credentials.key
ENV

echo "==> Backend: applying migrations"
( cd backend && .venv/bin/alembic upgrade head )

echo "==> Frontend: installing dependencies"
npm --prefix frontend ci --no-audit --no-fund

echo "==> Setup complete"
