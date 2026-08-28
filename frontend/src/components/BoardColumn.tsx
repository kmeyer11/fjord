import { useDroppable } from '@dnd-kit/core'
import type { ReactNode } from 'react'
import type { Task, TaskStatus } from '../api/types'
import TaskCard from './TaskCard'

export default function BoardColumn({
  status,
  title,
  tasks,
  footer,
}: {
  status: TaskStatus
  title: string
  tasks: Task[]
  footer?: ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <h2 className="mb-2 px-1 text-sm font-medium text-text-muted">
        {title} <span className="text-text-muted/60">{tasks.length}</span>
      </h2>
      <div
        ref={setNodeRef}
        className={[
          'flex min-h-24 flex-1 flex-col gap-2 rounded-xl border border-dashed p-2 transition-colors',
          isOver ? 'border-accent bg-accent/5' : 'border-border',
        ].join(' ')}
      >
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
        {footer}
      </div>
    </div>
  )
}
