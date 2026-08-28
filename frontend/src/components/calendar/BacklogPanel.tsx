import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '../../api/types'

export const BACKLOG_DROP_ID = 'backlog-panel'

function BacklogTask({ task, color }: { task: Task; color: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: { task },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={[
        'flex w-36 shrink-0 touch-none items-center gap-2 rounded-lg border border-hairline bg-surface px-2.5 py-2 text-[13px] md:w-auto',
        isDragging ? 'opacity-50' : 'cursor-grab active:cursor-grabbing',
      ].join(' ')}
    >
      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <span className="truncate text-text">{task.title}</span>
    </div>
  )
}

/**
 * Doubles as a bottom drag strip on mobile and a side list on desktop — a
 * modal/sheet would hide the calendar behind it, which breaks dragging a
 * backlog task onto a day/time slot on a touch screen.
 */
export default function BacklogPanel({
  tasks,
  projectColors,
}: {
  tasks: Task[]
  projectColors: Map<number, string>
}) {
  const { setNodeRef, isOver } = useDroppable({ id: BACKLOG_DROP_ID })

  return (
    <div
      ref={setNodeRef}
      className={[
        'fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-30 flex gap-2 overflow-x-auto border-t border-hairline bg-surface/90 p-2.5 backdrop-blur-xl transition-colors',
        'md:static md:inset-auto md:bottom-auto md:z-auto md:w-64 md:shrink-0 md:flex-col md:overflow-y-auto md:border-l md:border-t-0 md:p-3 md:backdrop-blur-none',
        isOver ? 'bg-accent-soft' : 'md:bg-surface/40',
      ].join(' ')}
    >
      <h2 className="hidden px-1 text-[13px] font-semibold text-text-secondary md:block">Backlog</h2>
      {tasks.length === 0 && (
        <p className="px-1 text-[12px] text-text-tertiary">Nothing unscheduled — drag a task here to unschedule it.</p>
      )}
      {tasks.map((t) => (
        <BacklogTask key={t.id} task={t} color={projectColors.get(t.project_id) ?? '#3c6e90'} />
      ))}
    </div>
  )
}
