import type { ExternalEvent, Project, ProjectWithCounts, Task, TaskPriority, TaskStatus } from './types'

export const UNAUTHORIZED_EVENT = 'fjord:unauthorized'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...init,
  })
  if (res.status === 401 && !path.startsWith('/auth/')) {
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
  }
  if (!res.ok) {
    const body = await res.text()
    let detail: string | undefined
    try {
      detail = (JSON.parse(body) as { detail?: string }).detail
    } catch {
      // not JSON — fall through to the raw response below
    }
    throw new Error(detail ?? `${res.status} ${res.statusText}: ${body}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  getAuthStatus: () => request<{ pin_set: boolean; authenticated: boolean }>('/auth/status'),
  login: (pin: string) => request<{ ok: true }>('/auth/login', { method: 'POST', body: JSON.stringify({ pin }) }),
  logout: () => request<{ ok: true }>('/auth/logout', { method: 'POST' }),
  getFeedToken: () => request<{ token: string }>('/auth/feed-token'),
  changePin: (pin: string) => request<{ ok: true }>('/auth/change-pin', { method: 'POST', body: JSON.stringify({ pin }) }),

  listProjects: () => request<ProjectWithCounts[]>('/projects'),
  getProject: (id: number) => request<ProjectWithCounts>(`/projects/${id}`),
  createProject: (data: { name: string; color: string }) =>
    request<ProjectWithCounts>('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id: number, data: Partial<Pick<Project, 'name' | 'color' | 'archived'>>) =>
    request<ProjectWithCounts>(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteProject: (id: number) => request<void>(`/projects/${id}`, { method: 'DELETE' }),

  listTasks: (status?: TaskStatus) =>
    request<Task[]>(`/tasks${status ? `?status=${status}` : ''}`),
  listProjectTasks: (projectId: number) => request<Task[]>(`/projects/${projectId}/tasks`),
  createTask: (
    projectId: number,
    data: { title: string; description?: string; priority?: TaskPriority },
  ) =>
    request<Task>(`/projects/${projectId}/tasks`, { method: 'POST', body: JSON.stringify(data) }),
  createMeeting: (data: { title: string; description?: string; due_at: string }) =>
    request<Task>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (
    id: number,
    data: Partial<{
      title: string
      description: string
      status: TaskStatus
      priority: TaskPriority
      due_at: string | null
    }>,
  ) => request<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTask: (id: number) => request<void>(`/tasks/${id}`, { method: 'DELETE' }),

  listExternalEvents: (start: Date, end: Date, force = false) =>
    request<ExternalEvent[]>(
      `/calendar/external-events?start=${start.toISOString()}&end=${end.toISOString()}${force ? '&force=true' : ''}`,
    ),
  getCalendarStatus: () =>
    request<{
      configured: boolean
      icloud_username: string | null
      last_synced_at: string | null
      last_error: string | null
    }>('/calendar/status'),
  connectICloud: (username: string, app_password: string) =>
    request<{ ok: true }>('/calendar/icloud-credentials', {
      method: 'POST',
      body: JSON.stringify({ username, app_password }),
    }),
  disconnectICloud: () => request<{ ok: true }>('/calendar/icloud-credentials', { method: 'DELETE' }),
}
