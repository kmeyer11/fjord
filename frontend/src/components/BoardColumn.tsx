import { useDroppable } from '@dnd-kit/core'
import type { ReactNode } from 'react'
import type { Task, TaskStatus } from '../api/types'
import TaskCard from './TaskCard'

export default function BoardColumn({
  status,
  title,
  tasks,
  headerAction,
  onTaskClick,
}: {
  status: TaskStatus
  title: string
  tasks: Task[]
  headerAction?: ReactNode
  onTaskClick?: (task: Task) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const dense = tasks.length > DENSE_THRESHOLD

  return (
    <div className="flex flex-col md:min-h-0 md:flex-1 md:w-72">
      <h2 className="mb-2 flex items-center gap-1.5 px-1 text-[13px] font-semibold text-text-secondary">
        {title} <span className="text-text-tertiary">{tasks.length}</span>
        {headerAction && <span className="ml-auto">{headerAction}</span>}
      </h2>
      <div
        ref={setNodeRef}
        className={[
          'flex min-h-24 flex-1 flex-col overflow-y-auto rounded-2xl border p-2 transition-colors md:min-h-0',
          dense ? 'gap-1' : 'gap-2',
          isOver ? 'border-accent/40 bg-accent-soft' : 'border-hairline bg-black/[0.02]',
        ].join(' ')}
      >
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} dense={dense} onClick={onTaskClick ? () => onTaskClick(task) : undefined} />
        ))}
      </div>
    </div>
  )
}

const DENSE_THRESHOLD = 5
