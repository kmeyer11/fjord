# Fjord — system map

A walkable map of the Fjord codebase (FastAPI backend + React frontend + a standalone MCP server), for an agent changing this code without re-reading the whole tree. The subject code stays the source of truth; this map cites it and never restates it.

See `CONTEXT.md` in this folder for how to walk the map and the naming collisions worth knowing before you touch anything.

## Where things live

| Folder | What it holds |
|---|---|
| `objects/` | one card per noun — a type, a store, a UI cluster |
| `processes/` | one card per verb — a movement that actually runs, input → output |
| `effects/` | change-impact index: "changing X? open these cards" |
| `_meta/schema.md` | the node types and naming rules this map follows |
| `_templates/` | blank `object.md` / `process.md` — copy, don't freehand a new card |

## Route by what you're doing

| If | Go to |
|---|---|
| "what is X" | `objects/_index.md` to find the cluster, then the card |
| "what breaks if I change X" | `effects/CONTEXT.md`, then the named object's "If you change this" |
| adding a new object or process | copy from `_templates/`, fill it in, add a line to `objects/_index.md` |
| the map and the code disagree | the code wins; fix the card, note the date |

## The one rule

Don't slurp `objects/` or `processes/` wholesale — the index and the change-impact card exist so a single card answers the question.
