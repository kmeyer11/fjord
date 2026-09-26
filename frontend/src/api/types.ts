export type TaskStatus = 'backlog' | 'in_progress' | 'done'
/** 1 (least critical) through 5 (most critical). */
export type TaskCriticality = 1 | 2 | 3 | 4 | 5
export type TaskCategory = 'task' | 'meeting'

export interface TaskCounts {
  backlog: number
  in_progress: number
  done: number
}

export interface Project {
  id: number
  name: string
  color: string
  archived: boolean
  favorite: boolean
}

export interface ProjectWithCounts extends Project {
  task_counts: TaskCounts
}

export interface Task {
  id: number
  project_id: number | null
  title: string
  description: string
  status: TaskStatus
  criticality: TaskCriticality
  category: TaskCategory
  due_at: string | null
  all_day: boolean
  /** Shared by every occurrence of a weekly-recurring meeting; null otherwise. */
  recurrence_id: string | null
  /** When the task last became 'done'; null otherwise, or if it's since moved out of Done. */
  completed_at: string | null
  /** Set when the user manually archived the task on demand; null otherwise. */
  archived_at: string | null
  created_at: string
  updated_at: string
}

/** A read-only event pulled from an Apple Calendar via CalDAV. */
export interface ExternalEvent {
  id: string
  calendar: string
  /** The source calendar's own color from Apple Calendar, e.g. "#2968d8" — null if unset/unsupported by the server. */
  calendar_color: string | null
  title: string
  start: string
  end: string
  all_day: boolean
  location: string | null
  description: string | null
}

/** Per-user preferences stored server-side (GET/PUT /api/preferences). */
export interface Preferences {
  /** Front-page scene preset name; null = the frontend's default. */
  scene: string | null
}
