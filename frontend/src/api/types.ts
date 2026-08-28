export type TaskStatus = 'backlog' | 'scheduled' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

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
  project_id: number
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  due_at: string | null
  created_at: string
  updated_at: string
}
