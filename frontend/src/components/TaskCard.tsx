import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '../api/types'

const PRIORITY_STYLES: Record<Task['priority'], string> = {
  low: 'text-text-tertiary bg-white/[0.05]',
  medium: 'text-birch bg-birch/15',
  high: 'text-clay bg-clay/15',
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
        'touch-none rounded-xl border border-hairline bg-surface-raised p-3 text-[14px] shadow-sm',
        isDragging ? 'opacity-50' : 'cursor-grab active:cursor-grabbing',
      ].join(' ')}
    >
      <p className="text-text">{task.title}</p>
      <div className="mt-2 flex items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${PRIORITY_STYLES[task.priority]}`}>
          {task.priority}
        </span>
        {task.due_at && (
          <span className="text-[11px] text-text-tertiary">
            {new Date(task.due_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  )
}
