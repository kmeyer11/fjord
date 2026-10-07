#!/usr/bin/env bash
# Conductor run script — starts this workspace's backend and Vite dev server on
# the workspace's own ports, so several workspaces can run side by side.
#   frontend: http://localhost:$CONDUCTOR_PORT
#   backend:  http://127.0.0.1:$((CONDUCTOR_PORT + 1))
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

if ! command -v npm >/dev/null 2>&1 && [ -s "$HOME/.nvm/nvm.sh" ]; then
  . "$HOME/.nvm/nvm.sh"
fi

FRONTEND_PORT="${CONDUCTOR_PORT:?CONDUCTOR_PORT is not set}"
BACKEND_PORT=$((FRONTEND_PORT + 1))

# Stop both servers together when Conductor stops the run script.
trap 'kill 0' EXIT

( cd backend && exec .venv/bin/uvicorn app.main:app --reload --host 127.0.0.1 --port "$BACKEND_PORT" ) &

# Vite's loadEnv picks this up from the environment, so frontend/.env.local
# isn't needed.
VITE_DEV_API_TARGET="http://127.0.0.1:$BACKEND_PORT" \
  npm --prefix frontend run dev -- --port "$FRONTEND_PORT" --strictPort &

wait
