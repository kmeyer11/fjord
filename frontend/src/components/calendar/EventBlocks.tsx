import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { ExternalEvent, Task } from '../../api/types'
import { RepeatIcon } from '../icons'

export const HOUR_HEIGHT = 48
export const BLOCK_HEIGHT = 24

// Rounded to a whole pixel — a fractional `top` (e.g. from a 9:07 due time)
// renders fine in Chrome, but Safari can hit-test it a couple pixels off from
// where it's painted, making the event's clickable area drift from its visual position.
function topFor(date: Date) {
  return Math.round((date.getHours() + date.getMinutes() / 60) * HOUR_HEIGHT)
}

export function CalendarTaskBlock({ task, color, onClick }: { task: Task; color: string; onClick?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `week-task-${task.id}`,
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
      {task.recurrence_id != null && <RepeatIcon className="size-2.5 shrink-0" />}
      <span className="truncate">{task.title}</span>
    </button>
  )
}

export function ExternalEventBlock({ event, onClick }: { event: ExternalEvent; onClick?: () => void }) {
  const start = new Date(event.start)
  const end = new Date(event.end)
  const height = Math.max((topFor(end) - topFor(start)) || BLOCK_HEIGHT, 18)
  const color = event.calendar_color

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        top: topFor(start),
        height,
        ...(color ? { backgroundColor: `${color}1f`, borderColor: `${color}80` } : undefined),
      }}
      className={[
        'pointer-events-auto absolute inset-x-0.5 z-0 flex cursor-pointer items-center gap-1 overflow-hidden rounded-md border border-dashed px-1.5 py-0.5 text-left text-[11px] text-text-secondary',
        color ? '' : 'border-text-tertiary/50 bg-surface/70',
      ].join(' ')}
      title={`${event.title} — ${event.calendar} (read-only)`}
    >
      {color && <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />}
      <span className="truncate">{event.title}</span>
    </button>
  )
}

/** Rendered in the strip above the hourly grid, not positioned by time of day. */
export function AllDayTaskChip({ task, color, onClick }: { task: Task; color: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ backgroundColor: `${color}1f`, color }}
      className={[
        'flex w-full cursor-pointer items-center gap-1 truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium',
        task.status === 'done' ? 'opacity-50 line-through' : '',
      ].join(' ')}
    >
      {task.recurrence_id != null && <RepeatIcon className="size-2.5 shrink-0" />}
      <span className="truncate">{task.title}</span>
    </button>
  )
}

export function AllDayExternalEventChip({ event, onClick }: { event: ExternalEvent; onClick?: () => void }) {
  const color = event.calendar_color
  return (
    <button
      type="button"
      onClick={onClick}
      style={color ? { backgroundColor: `${color}1f`, borderColor: `${color}80` } : undefined}
      className={[
        'w-full cursor-pointer truncate rounded border border-dashed px-1.5 py-0.5 text-left text-[11px] text-text-secondary',
        color ? '' : 'border-text-tertiary/50 bg-surface/70',
      ].join(' ')}
      title={`${event.title} — ${event.calendar} (read-only)`}
    >
      {event.title}
    </button>
  )
}
