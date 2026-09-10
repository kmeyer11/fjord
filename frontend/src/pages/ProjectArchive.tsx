import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { ProjectWithCounts, Task } from '../api/types'
import { CRITICALITY_STYLES } from '../components/CriticalityPicker'
import EditProjectModal from '../components/EditProjectModal'
import ProjectHeader from '../components/ProjectHeader'
import TaskDetailModal from '../components/TaskDetailModal'
import { useLanguage } from '../i18n/LanguageContext'

export default function ProjectArchive() {
  const { t, locale } = useLanguage()
  const { projectId } = useParams()
  const navigate = useNavigate()
  const id = Number(projectId)

  const [project, setProject] = useState<ProjectWithCounts | null>(null)
  const [tasks, setTasks] = useState<Task[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editingProject, setEditingProject] = useState(false)

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
    <div className="p-4 md:p-8">
      <ProjectHeader
        project={project}
        id={id}
        view="archive"
        onToggleFavorite={async () => {
          const updated = await api.updateProject(id, { favorite: !project.favorite })
          setProject(updated)
          window.dispatchEvent(new Event('fjord:projects-changed'))
        }}
        onEditProject={() => setEditingProject(true)}
      />

      <div className="mx-auto max-w-2xl">
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
                {(task.completed_at || task.archived_at) && (
                  <span className="shrink-0 text-[12px] text-text-tertiary">
                    {task.completed_at
                      ? t.projectArchive.completedOn(
                          new Date(task.completed_at).toLocaleDateString(locale, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          }),
                        )
                      : t.projectArchive.archivedOn(
                          new Date(task.archived_at as string).toLocaleDateString(locale, {
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
      </div>

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

      {editingProject && (
        <EditProjectModal
          project={project}
          onClose={() => setEditingProject(false)}
          onSave={async (data) => {
            const updated = await api.updateProject(id, data)
            setProject(updated)
          }}
          onDelete={async () => {
            await api.deleteProject(id)
            navigate('/projects')
          }}
        />
      )}
    </div>
  )
}
