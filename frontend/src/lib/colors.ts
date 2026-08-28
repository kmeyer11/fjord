import type { Task } from '../api/types'

/** Fixed color for meetings, which have no project (and so no project color). */
export const MEETING_COLOR = '#75587f'

const DEFAULT_PROJECT_COLOR = '#3c6e90'

export function taskColor(task: Task, projectColors: Map<number, string>): string {
  if (task.category === 'meeting') return MEETING_COLOR
  return (task.project_id != null ? projectColors.get(task.project_id) : undefined) ?? DEFAULT_PROJECT_COLOR
}
