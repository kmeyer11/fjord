import type { Project, ProjectWithCounts, Task, TaskPriority, TaskStatus } from './types'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...init,
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`${res.status} ${res.statusText}: ${body}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  listProjects: () => request<ProjectWithCounts[]>('/projects'),
  getProject: (id: number) => request<ProjectWithCounts>(`/projects/${id}`),
  createProject: (data: { name: string; color: string }) =>
    request<ProjectWithCounts>('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id: number, data: Partial<Pick<Project, 'name' | 'color' | 'archived'>>) =>
    request<ProjectWithCounts>(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteProject: (id: number) => request<void>(`/projects/${id}`, { method: 'DELETE' }),

  listProjectTasks: (projectId: number) => request<Task[]>(`/projects/${projectId}/tasks`),
  createTask: (
    projectId: number,
    data: { title: string; description?: string; priority?: TaskPriority },
  ) =>
    request<Task>(`/projects/${projectId}/tasks`, { method: 'POST', body: JSON.stringify(data) }),
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
}
