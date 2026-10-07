# Working conventions

- Don't push commits directly to `main`. Create a feature branch, push that, and open a PR (e.g. via `gh pr create`) instead of pushing straight to `main`.
- One feature branch and PR per change.
- Write code, comments, commit messages, and PR text in English.
- Put UI text in `frontend/src/i18n/translations.ts`; never hard-code it in components.
- Commit subjects: short, capitalized, imperative, no prefix (e.g. "Drop deleted meetings from the ICS feed instead of marking them cancelled"). Explain the why in the body.

## Running the app

- Use Conductor's Run button or `scripts/conductor-run.sh`. The frontend runs on `$CONDUCTOR_PORT`, the backend on `$CONDUCTOR_PORT + 1`.

## Off limits

- Never read, copy, or commit `backend/.dev-data/secrets.json`, `*.key` files, or `.env` files.
- Never touch the main checkout's database (`$CONDUCTOR_ROOT_PATH/backend/.dev-data/`); each workspace has its own copy.

## Understanding this codebase

Before reading source to answer "what is X" or "what does changing X hit," check `map/CLAUDE.md` — a system map of the backend, frontend, and MCP server with per-noun change-impact notes.
