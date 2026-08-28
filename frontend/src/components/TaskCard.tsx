import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '../api/types'

const PRIORITY_STYLES: Record<Task['priority'], string> = {
  low: 'text-text-muted bg-surface',
  medium: 'text-amber-300 bg-amber-950/40',
  high: 'text-red-300 bg-red-950/40',
}

export default function TaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={[
        'touch-none rounded-lg border border-border bg-surface-raised p-3 text-sm shadow-sm',
        isDragging ? 'opacity-50' : 'cursor-grab active:cursor-grabbing',
      ].join(' ')}
    >
      <p className="text-text">{task.title}</p>
      <div className="mt-2 flex items-center gap-2">
        <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${PRIORITY_STYLES[task.priority]}`}>
          {task.priority}
        </span>
        {task.due_at && (
          <span className="text-xs text-text-muted">
            {new Date(task.due_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  )
}
