import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { ExternalEvent, Task } from '../../api/types'

export const HOUR_HEIGHT = 48
export const BLOCK_HEIGHT = 24

function topFor(date: Date) {
  return (date.getHours() + date.getMinutes() / 60) * HOUR_HEIGHT
}

export function CalendarTaskBlock({ task, color, onClick }: { task: Task; color: string; onClick?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: { task },
  })
  if (!task.due_at) return null

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      style={{
        top: topFor(new Date(task.due_at)),
        height: BLOCK_HEIGHT,
        backgroundColor: `${color}1f`,
        color,
        transform: CSS.Translate.toString(transform),
      }}
      className={[
        'pointer-events-auto absolute inset-x-0.5 flex touch-none items-center gap-1 overflow-hidden rounded-md px-1.5 text-left text-[11px] font-medium',
        isDragging ? 'z-20 opacity-60' : 'z-10 cursor-grab active:cursor-grabbing',
        task.status === 'done' ? 'opacity-50 line-through' : '',
      ].join(' ')}
    >
      <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <span className="truncate">{task.title}</span>
    </button>
  )
}

export function ExternalEventBlock({ event }: { event: ExternalEvent }) {
  const start = new Date(event.start)
  const end = new Date(event.end)
  const height = Math.max((topFor(end) - topFor(start)) || BLOCK_HEIGHT, 18)

  return (
    <div
      style={{ top: topFor(start), height }}
      className="pointer-events-none absolute inset-x-0.5 z-0 overflow-hidden rounded-md border border-dashed border-text-tertiary/50 bg-surface/70 px-1.5 py-0.5 text-[11px] text-text-secondary"
      title={`${event.title} — ${event.calendar} (read-only)`}
    >
      <span className="truncate">{event.title}</span>
    </div>
  )
}
