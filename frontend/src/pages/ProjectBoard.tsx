import { DndContext, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { ProjectWithCounts, Task, TaskStatus } from '../api/types'
import BoardColumn from '../components/BoardColumn'
import EditProjectModal from '../components/EditProjectModal'
import { ArchiveIcon, ChevronLeftIcon, PencilIcon, PlusIcon, StarIcon } from '../components/icons'
import NewTaskModal from '../components/NewTaskModal'
import TaskDetailModal from '../components/TaskDetailModal'
import { useLanguage } from '../i18n/LanguageContext'

export default function ProjectBoard() {
  const { t } = useLanguage()
  const { projectId } = useParams()
  const navigate = useNavigate()
  const id = Number(projectId)

  const COLUMNS: { status: TaskStatus; title: string }[] = [
    { status: 'backlog', title: t.board.backlog },
    { status: 'in_progress', title: t.board.inProgress },
    { status: 'done', title: t.board.done },
  ]

  const [project, setProject] = useState<ProjectWithCounts | null>(null)
  const [tasks, setTasks] = useState<Task[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [creatingTask, setCreatingTask] = useState(false)
  const [editingProject, setEditingProject] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  )

  function reload() {
    Promise.all([api.getProject(id), api.listProjectTasks(id)])
      .then(([p, t]) => {
        setProject(p)
        setTasks(t)
      })
      .catch((e) => setError(String(e)))
  }

  useEffect(reload, [id])

  async function handleDragEnd(event: DragEndEvent) {
    const newStatus = event.over?.id as TaskStatus | undefined
    const taskId = event.active.id as number
    if (!newStatus || !tasks) return

    const task = tasks.find((t) => t.id === taskId)
    if (!task || task.status === newStatus) return

    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)))
    try {
      await api.updateTask(taskId, { status: newStatus })
    } catch (e) {
      setError(String(e))
      reload()
    }
  }

  if (error)
    return (
      <p className="p-4 text-sm text-clay md:p-8">
        {t.board.loadError}: {error}
      </p>
    )
  if (!project || !tasks) return <p className="p-4 text-sm text-text-secondary md:p-8">{t.board.loading}</p>

  return (
    <div className="flex h-full flex-col p-4 md:p-8">
      <div className="mb-5 flex items-center gap-1.5">
        <Link to="/projects" className="-ml-1.5 rounded-full p-1.5 text-accent hover:bg-black/[0.04]">
          <ChevronLeftIcon className="size-5" />
        </Link>
        <span
          className="size-2.5 rounded-full"
          style={{ backgroundColor: project.color, boxShadow: `0 0 0 4px ${project.color}26` }}
        />
        <h1 className="text-[20px] font-bold tracking-tight text-text">{project.name}</h1>
        <button
          onClick={async () => {
            const updated = await api.updateProject(id, { favorite: !project.favorite })
            setProject(updated)
            window.dispatchEvent(new Event('fjord:projects-changed'))
          }}
          aria-label={project.favorite ? t.dashboard.unfavorite : t.dashboard.favorite}
          className={[
            'rounded-full p-1.5 transition-colors hover:bg-black/[0.04]',
            project.favorite ? 'text-amber-400' : 'text-text-tertiary hover:text-text-secondary',
          ].join(' ')}
        >
          <StarIcon className="size-4" filled={project.favorite} />
        </button>
        <button
          onClick={() => setEditingProject(true)}
          aria-label={t.editProjectModal.title}
          className="rounded-full p-1.5 text-text-tertiary hover:bg-black/[0.04] hover:text-text-secondary"
        >
          <PencilIcon className="size-4" />
        </button>
        <Link
          to={`/projects/${id}/archive`}
          aria-label={t.board.archive}
          title={t.board.archive}
          className="rounded-full p-1.5 text-text-tertiary hover:bg-black/[0.04] hover:text-text-secondary"
        >
          <ArchiveIcon className="size-4" />
        </Link>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto md:flex-row md:overflow-visible">
          {COLUMNS.map(({ status, title }) => (
            <BoardColumn
              key={status}
              status={status}
              title={title}
              tasks={tasks.filter((t) => t.status === status)}
              onTaskClick={setEditingTask}
              headerAction={
                status === 'backlog' ? (
                  <button
                    onClick={() => setCreatingTask(true)}
                    aria-label={t.board.addTask}
                    title={t.board.addTask}
                    className="flex size-6 items-center justify-center rounded-full bg-accent text-bg transition-opacity hover:opacity-90 active:opacity-80"
                  >
                    <PlusIcon className="size-3.5" />
                  </button>
                ) : undefined
              }
            />
          ))}
        </div>
      </DndContext>

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

      {creatingTask && (
        <NewTaskModal
          onClose={() => setCreatingTask(false)}
          onCreate={async (data) => {
            const task = await api.createTask(id, data)
            setTasks((prev) => (prev ? [...prev, task] : [task]))
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
