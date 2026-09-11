"""MCP server exposing Fjord's projects/tasks/meetings API as tools, so a
Claude session can create and manage them directly (see repo root README's
"Claude integration" section for setup).

Talks to a running Fjord backend over HTTP using a long-lived bearer token
(generate one with `cd backend && .venv/bin/python -m app.generate_api_token`
on the machine running the instance you want to point at) — separate from
the browser's PIN/session-cookie login. Configure via environment variables:

    FJORD_API_URL    Base URL of the Fjord backend, e.g. http://localhost:8000
                      or a Tailscale hostname for the homelab instance.
    FJORD_API_TOKEN   Token from generate_api_token.py.

Run directly for local testing (stdio transport):

    .venv/bin/python server.py
"""

import os
from typing import Any

import httpx
from mcp.server.mcpserver import MCPServer

FJORD_API_URL = os.environ.get("FJORD_API_URL", "http://localhost:8000").rstrip("/")
FJORD_API_TOKEN = os.environ["FJORD_API_TOKEN"]

mcp = MCPServer("fjord")


def _client() -> httpx.Client:
    return httpx.Client(
        base_url=FJORD_API_URL,
        headers={"Authorization": f"Bearer {FJORD_API_TOKEN}"},
        timeout=10,
    )


def _request(method: str, path: str, **kwargs: Any) -> Any:
    with _client() as client:
        response = client.request(method, path, **kwargs)
        response.raise_for_status()
        return response.json() if response.content else None


def _without_none(**fields: Any) -> dict[str, Any]:
    return {key: value for key, value in fields.items() if value is not None}


@mcp.tool()
def list_projects(include_archived: bool = False) -> list[dict]:
    """List Fjord projects, each with its backlog/scheduled/done task counts."""
    return _request("GET", "/api/projects", params={"include_archived": include_archived})


@mcp.tool()
def create_project(name: str, color: str = "#3c6e90") -> dict:
    """Create a new Fjord project. `color` is a hex string like "#3c6e90"."""
    return _request("POST", "/api/projects", json={"name": name, "color": color})


@mcp.tool()
def list_tasks(status: str | None = None) -> list[dict]:
    """List every task and meeting across all projects (the calendar/backlog view).
    `status` optionally filters to one of: backlog, in_progress, done."""
    return _request("GET", "/api/tasks", params=_without_none(status=status))


@mcp.tool()
def list_project_tasks(project_id: int) -> list[dict]:
    """List the active (non-archived) tasks belonging to one project."""
    return _request("GET", f"/api/projects/{project_id}/tasks")


@mcp.tool()
def create_task(
    project_id: int,
    title: str,
    description: str = "",
    status: str = "backlog",
    criticality: int = 3,
    due_at: str | None = None,
    all_day: bool = False,
) -> dict:
    """Create a task in a project's backlog board.

    `status` is one of: backlog, in_progress, done.
    `criticality` ranges 1 (least) to 5 (most critical).
    `due_at`, if set, is an ISO 8601 datetime (include a UTC offset, e.g.
    "2026-09-15T14:00:00+02:00") and puts the task on the calendar.
    """
    payload = {
        "title": title,
        "description": description,
        "status": status,
        "criticality": criticality,
        "due_at": due_at,
        "all_day": all_day,
    }
    return _request("POST", f"/api/projects/{project_id}/tasks", json=payload)


@mcp.tool()
def create_meeting(
    title: str,
    due_at: str,
    description: str = "",
    all_day: bool = False,
    recurring: bool = False,
) -> dict:
    """Create a meeting (a project-less calendar entry, distinct from a task).

    `due_at` is an ISO 8601 datetime with a UTC offset, e.g.
    "2026-09-15T14:00:00+02:00". If `recurring` is true, it repeats weekly on
    that same weekday and time.
    """
    payload = {"title": title, "description": description, "due_at": due_at, "all_day": all_day, "recurring": recurring}
    return _request("POST", "/api/tasks", json=payload)


@mcp.tool()
def update_task(
    task_id: int,
    title: str | None = None,
    description: str | None = None,
    status: str | None = None,
    criticality: int | None = None,
    due_at: str | None = None,
    all_day: bool | None = None,
    project_id: int | None = None,
    recurring: bool | None = None,
) -> dict:
    """Update fields on an existing task or meeting; only pass the fields to change.

    `status` is one of: backlog, in_progress, done.
    `recurring` (meetings only): true turns this and future occurrences into a
    weekly series starting from its due_at; false detaches it and drops future
    occurrences.
    """
    payload = _without_none(
        title=title,
        description=description,
        status=status,
        criticality=criticality,
        due_at=due_at,
        all_day=all_day,
        project_id=project_id,
        recurring=recurring,
    )
    return _request("PATCH", f"/api/tasks/{task_id}", json=payload)


@mcp.tool()
def delete_task(task_id: int, scope: str = "single") -> str:
    """Delete a task or meeting. For a recurring meeting, `scope="future"`
    deletes this and all later occurrences instead of just this one."""
    _request("DELETE", f"/api/tasks/{task_id}", params={"scope": scope})
    return f"Deleted task {task_id} (scope={scope})"


if __name__ == "__main__":
    mcp.run()
