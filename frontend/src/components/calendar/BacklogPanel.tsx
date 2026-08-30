import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '../../api/types'
import { useLanguage } from '../../i18n/LanguageContext'
import { taskColor } from '../../lib/colors'
import { RepeatIcon } from '../icons'
import NewMeetingInline from '../NewMeetingInline'

export const BACKLOG_DROP_ID = 'backlog-panel'

function DraggableTask({
  task,
  color,
  subtitle,
  onClick,
}: {
  task: Task
  color: string
  subtitle?: string
  onClick?: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: { task },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={[
        'flex w-36 shrink-0 touch-none items-center gap-2 rounded-lg border border-hairline bg-surface px-2.5 py-2 text-[13px] md:w-auto',
        isDragging ? 'opacity-50' : 'cursor-grab active:cursor-grabbing',
      ].join(' ')}
    >
      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 truncate text-text">
          {task.recurrence_id != null && <RepeatIcon className="size-3 shrink-0 text-text-tertiary" />}
          <span className="truncate">{task.title}</span>
        </p>
        {subtitle && <p className="truncate text-[11px] text-text-tertiary">{subtitle}</p>}
      </div>
    </div>
  )
}

/**
 * Doubles as a bottom drag strip on mobile and a side list on desktop — a
 * modal/sheet would hide the calendar behind it, which breaks dragging a
 * backlog task onto a day/time slot on a touch screen. The "Scheduled"
 * overview only shows on desktop, where there's room for it.
 */
export default function BacklogPanel({
  backlogTasks,
  scheduledTasks,
  meetingTasks,
  projectColors,
  onCreateMeeting,
  onTaskClick,
}: {
  backlogTasks: Task[]
  scheduledTasks: Task[]
  meetingTasks: Task[]
  projectColors: Map<number, string>
  onCreateMeeting: (data: { title: string; due_at: string; recurring?: boolean }) => Promise<void>
  onTaskClick?: (task: Task) => void
}) {
  const { t, locale } = useLanguage()
  const { setNodeRef, isOver } = useDroppable({ id: BACKLOG_DROP_ID })

  return (
    <div
      ref={setNodeRef}
      className={[
        'fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-30 flex gap-2 overflow-x-auto border-t border-hairline bg-surface/90 p-2.5 backdrop-blur-xl transition-colors',
        'md:static md:inset-auto md:bottom-auto md:z-auto md:w-64 md:shrink-0 md:flex-col md:gap-5 md:overflow-y-auto md:border-l md:border-t-0 md:p-3 md:backdrop-blur-none',
        isOver ? 'bg-accent-soft' : 'md:bg-surface/40',
      ].join(' ')}
    >
      <div className="flex gap-2 md:flex-col md:gap-2">
        <h2 className="hidden px-1 text-[13px] font-semibold text-text-secondary md:block">{t.calendar.backlog}</h2>
        {backlogTasks.length === 0 && (
          <p className="px-1 text-[12px] text-text-tertiary">{t.calendar.nothingUnscheduled}</p>
        )}
        {backlogTasks.map((task) => (
          <DraggableTask
            key={task.id}
            task={task}
            color={taskColor(task, projectColors)}
            onClick={onTaskClick ? () => onTaskClick(task) : undefined}
          />
        ))}
      </div>

      {scheduledTasks.length > 0 && (
        <div className="hidden flex-col gap-2 md:flex">
          <h2 className="px-1 text-[13px] font-semibold text-text-secondary">{t.calendar.scheduled}</h2>
          {scheduledTasks
            .slice()
            .sort((a, b) => (a.due_at ?? '').localeCompare(b.due_at ?? ''))
            .map((task) => (
              <DraggableTask
                key={task.id}
                task={task}
                color={taskColor(task, projectColors)}
                onClick={onTaskClick ? () => onTaskClick(task) : undefined}
                subtitle={
                  task.due_at
                    ? new Date(task.due_at).toLocaleString(locale, {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })
                    : undefined
                }
              />
            ))}
        </div>
      )}

      <div className="hidden flex-col gap-2 md:flex">
        <h2 className="px-1 text-[13px] font-semibold text-text-secondary">{t.calendar.meetings}</h2>
        <NewMeetingInline onCreate={onCreateMeeting} />
        {meetingTasks
          .slice()
          .sort((a, b) => (a.due_at ?? '').localeCompare(b.due_at ?? ''))
          .map((task) => (
            <DraggableTask
              key={task.id}
              task={task}
              color={taskColor(task, projectColors)}
              onClick={onTaskClick ? () => onTaskClick(task) : undefined}
              subtitle={
                task.due_at
                  ? new Date(task.due_at).toLocaleString(locale, {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })
                  : undefined
              }
            />
          ))}
      </div>
    </div>
  )
}
