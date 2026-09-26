# Schema — the rules of this map

Closed set of node types this map uses. When practice and this file disagree, reconcile the same day.

## Node types

| `type:` | Lives at | Carries |
|---|---|---|
| object | `objects/<cluster>/<slug>.md` | a noun: shape, connections, blast radius |
| process | `processes/<slug>.md` | a verb: input → movement → output, steps with citations |

## Labels that make it queryable

- `cluster`: which shelf in `objects/` the card lives on.
- `universe`: `live` (in force, implement/cite against) · `leftover` (present, not the main path) · `ghost` (named/filed, not wired).
- `status`: `stub` (listed, no body yet) · `verified` (dated, cites a commit/branch) · `stale` (was verified, no longer trusted).
- `consumes:` / `produces:` on process cards — wikilinks to object cards.

## Naming

- Slugs: kebab-case, matching the source symbol where one exists (`task.md` for `models.Task`, not `tasks.md`).
- Product language that disagrees with the code name is stated once in the card's opening line (e.g. "Meeting" in the UI = a `Task` row with `category=meeting`), never silently renamed either direction.
- Generated files (`AGENTS.md`, `routing.md`, `objects/_index.md`) are rebuilt from `CLAUDE.md` / the cards — never hand-edited.
