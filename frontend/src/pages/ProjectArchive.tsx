import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { ProjectWithCounts, Task } from '../api/types'
import { CRITICALITY_STYLES } from '../components/CriticalityPicker'
import { ChevronLeftIcon } from '../components/icons'
import TaskDetailModal from '../components/TaskDetailModal'
import { useLanguage } from '../i18n/LanguageContext'

export default function ProjectArchive() {
  const { t, locale } = useLanguage()
  const { projectId } = useParams()
  const id = Number(projectId)

  const [project, setProject] = useState<ProjectWithCounts | null>(null)
  const [tasks, setTasks] = useState<Task[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  useEffect(() => {
    Promise.all([api.getProject(id), api.listProjectArchive(id)])
      .then(([p, archived]) => {
        setProject(p)
        setTasks(archived)
      })
      .catch((e) => setError(String(e)))
  }, [id])

  if (error)
    return (
      <p className="p-4 text-sm text-clay md:p-8">
        {t.projectArchive.loadError}: {error}
      </p>
    )
  if (!project || !tasks) return <p className="p-4 text-sm text-text-secondary md:p-8">{t.projectArchive.loading}</p>

  return (
    <div className="mx-auto max-w-2xl p-4 md:p-8">
      <div className="mb-5 flex items-center gap-1.5">
        <Link to={`/projects/${id}`} className="-ml-1.5 rounded-full p-1.5 text-accent hover:bg-black/[0.04]">
          <ChevronLeftIcon className="size-5" />
        </Link>
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: project.color, boxShadow: `0 0 0 4px ${project.color}26` }}
        />
        <div>
          <h1 className="text-[18px] font-bold leading-tight tracking-tight text-text">{project.name}</h1>
          <p className="text-[12px] font-medium text-text-tertiary">{t.projectArchive.title}</p>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-hairline-strong px-6 py-14 text-center">
          <p className="text-sm text-text-secondary">{t.projectArchive.empty}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => setEditingTask(task)}
              className="flex items-center gap-3 rounded-xl border border-hairline bg-surface-raised p-3 text-left text-[14px] shadow-sm hover:border-hairline-strong"
            >
              <span
                className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${CRITICALITY_STYLES[task.criticality]}`}
              >
                {task.criticality}
              </span>
              <span className="min-w-0 flex-1 truncate text-text">{task.title}</span>
              {task.completed_at && (
                <span className="shrink-0 text-[12px] text-text-tertiary">
                  {t.projectArchive.completedOn(
                    new Date(task.completed_at).toLocaleDateString(locale, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    }),
                  )}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {editingTask && (
        <TaskDetailModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={async (data) => {
            const updated = await api.updateTask(editingTask.id, data)
            setTasks((prev) => (prev ? prev.map((t) => (t.id === updated.id ? updated : t)) : prev))
          }}
          onDelete={async () => {
            await api.deleteTask(editingTask.id)
            setTasks((prev) => (prev ? prev.filter((t) => t.id !== editingTask.id) : prev))
          }}
        />
      )}
    </div>
  )
}
