import { Link } from 'react-router-dom'
import type { ProjectWithCounts } from '../api/types'

export default function ProjectCard({ project }: { project: ProjectWithCounts }) {
  const total = project.task_counts.backlog + project.task_counts.scheduled + project.task_counts.done

  return (
    <Link
      to={`/projects/${project.id}`}
      className="group flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-text-muted"
    >
      <div className="flex items-center gap-2">
        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: project.color }} />
        <h3 className="truncate font-medium text-text">{project.name}</h3>
      </div>

      {total === 0 ? (
        <p className="text-sm text-text-muted">No tasks yet</p>
      ) : (
        <div className="flex gap-4 text-sm text-text-muted">
          <span>{project.task_counts.backlog} backlog</span>
          <span>{project.task_counts.scheduled} scheduled</span>
          <span>{project.task_counts.done} done</span>
        </div>
      )}
    </Link>
  )
}
