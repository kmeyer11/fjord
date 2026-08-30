export type TaskStatus = 'backlog' | 'scheduled' | 'done'
/** 1 (least critical) through 5 (most critical). */
export type TaskCriticality = 1 | 2 | 3 | 4 | 5
export type TaskCategory = 'task' | 'meeting'

export interface TaskCounts {
  backlog: number
  scheduled: number
  done: number
}

export interface Project {
  id: number
  name: string
  color: string
  archived: boolean
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
  created_at: string
  updated_at: string
}

/** A read-only event pulled from an Apple Calendar via CalDAV. */
export interface ExternalEvent {
  id: string
  calendar: string
  title: string
  start: string
  end: string
  all_day: boolean
  location: string | null
  description: string | null
}
