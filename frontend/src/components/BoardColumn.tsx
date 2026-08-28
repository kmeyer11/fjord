import { useDroppable } from '@dnd-kit/core'
import type { ReactNode } from 'react'
import type { Task, TaskStatus } from '../api/types'
import TaskCard from './TaskCard'

export default function BoardColumn({
  status,
  title,
  tasks,
  footer,
  onTaskClick,
}: {
  status: TaskStatus
  title: string
  tasks: Task[]
  footer?: ReactNode
  onTaskClick?: (task: Task) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div className="flex min-h-0 flex-1 flex-col md:w-72">
      <h2 className="mb-2 flex items-center gap-1.5 px-1 text-[13px] font-semibold text-text-secondary">
        {title} <span className="text-text-tertiary">{tasks.length}</span>
      </h2>
      <div
        ref={setNodeRef}
        className={[
          'flex min-h-24 flex-1 flex-col gap-2 rounded-2xl border p-2 transition-colors',
          isOver ? 'border-accent/40 bg-accent-soft' : 'border-hairline bg-black/[0.02]',
        ].join(' ')}
      >
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onClick={onTaskClick ? () => onTaskClick(task) : undefined} />
        ))}
        {footer}
      </div>
    </div>
  )
}
