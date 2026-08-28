import { Link } from 'react-router-dom'
import type { ProjectWithCounts } from '../api/types'
import { useLanguage } from '../i18n/LanguageContext'

export default function ProjectCard({ project }: { project: ProjectWithCounts }) {
  const { t } = useLanguage()
  const total = project.task_counts.backlog + project.task_counts.scheduled + project.task_counts.done

  return (
    <Link
      to={`/projects/${project.id}`}
      className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-hairline bg-surface p-4 transition-colors hover:border-hairline-strong"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07] transition-opacity group-hover:opacity-[0.12]"
        style={{ background: `radial-gradient(120px 90px at 0% 0%, ${project.color}, transparent)` }}
      />

      <div className="relative flex items-center gap-2.5">
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: project.color, boxShadow: `0 0 0 4px ${project.color}26` }}
        />
        <h3 className="truncate text-[15px] font-semibold text-text">{project.name}</h3>
      </div>

      {total === 0 ? (
        <p className="relative text-[13px] text-text-tertiary">{t.dashboard.noTasksYet}</p>
      ) : (
        <div className="relative flex gap-3.5 text-[13px] text-text-secondary">
          <span>
            {project.task_counts.backlog} {t.dashboard.backlog}
          </span>
          <span>
            {project.task_counts.scheduled} {t.dashboard.scheduled}
          </span>
          <span>
            {project.task_counts.done} {t.dashboard.done}
          </span>
        </div>
      )}
    </Link>
  )
}
