import { Link } from 'react-router-dom'
import type { ProjectWithCounts } from '../api/types'
import { useLanguage } from '../i18n/LanguageContext'
import { ArchiveIcon, ChevronLeftIcon, PencilIcon, StarIcon } from './icons'

/**
 * Shared by ProjectBoard and ProjectArchive so the title/star/pencil/archive
 * row stays pixel-identical between the two pages — it used to be two
 * hand-written headers with different container widths and font sizes,
 * which made the row visibly jump when navigating between them.
 */
export default function ProjectHeader({
  project,
  id,
  view,
  onToggleFavorite,
  onEditProject,
}: {
  project: ProjectWithCounts
  id: number
  view: 'board' | 'archive'
  onToggleFavorite: () => void
  onEditProject: () => void
}) {
  const { t } = useLanguage()

  return (
    <div className="mb-5 flex items-center gap-1.5">
      <Link
        to={view === 'board' ? '/projects' : `/projects/${id}`}
        className="-ml-1.5 rounded-full p-1.5 text-accent hover:bg-black/[0.04]"
      >
        <ChevronLeftIcon className="size-5" />
      </Link>
      <span
        className="size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: project.color, boxShadow: `0 0 0 4px ${project.color}26` }}
      />
      <h1 className="text-[20px] font-bold tracking-tight text-text">{project.name}</h1>
      <button
        onClick={onToggleFavorite}
        aria-label={project.favorite ? t.dashboard.unfavorite : t.dashboard.favorite}
        className={[
          'rounded-full p-1.5 transition-colors hover:bg-black/[0.04]',
          project.favorite ? 'text-amber-400' : 'text-text-tertiary hover:text-text-secondary',
        ].join(' ')}
      >
        <StarIcon className="size-4" filled={project.favorite} />
      </button>
      <button
        onClick={onEditProject}
        aria-label={t.editProjectModal.title}
        className="rounded-full p-1.5 text-text-tertiary hover:bg-black/[0.04] hover:text-text-secondary"
      >
        <PencilIcon className="size-4" />
      </button>
      {view === 'board' ? (
        <Link
          to={`/projects/${id}/archive`}
          aria-label={t.board.archive}
          title={t.board.archive}
          className="rounded-full p-1.5 text-text-tertiary hover:bg-black/[0.04] hover:text-text-secondary"
        >
          <ArchiveIcon className="size-4" />
        </Link>
      ) : (
        <span
          aria-label={t.projectArchive.title}
          title={t.projectArchive.title}
          className="rounded-full bg-black/[0.04] p-1.5 text-text-secondary"
        >
          <ArchiveIcon className="size-4" />
        </span>
      )}
    </div>
  )
}
