import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { ExternalEvent, Task } from '../../api/types'
import { useLanguage } from '../../i18n/LanguageContext'
import { dateKey, getMonthGridDays, isSameDay } from '../../lib/date'
import { useIsDesktop } from '../../lib/useIsDesktop'

const MAX_VISIBLE_DESKTOP = 3

function MonthTaskChip({ task, color, onClick }: { task: Task; color: string; onClick?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: { task },
  })
  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      style={{ backgroundColor: `${color}1f`, color, transform: CSS.Translate.toString(transform) }}
      className={[
        'touch-none truncate rounded px-1 py-0.5 text-left text-[10px] font-medium',
        isDragging ? 'z-10 opacity-60' : '',
        task.status === 'done' ? 'opacity-50 line-through' : '',
      ].join(' ')}
    >
      {task.title}
    </button>
  )
}

function MonthDayCell({
  date,
  inMonth,
  tasks,
  externalEvents,
  projectColors,
  onTaskClick,
}: {
  date: Date
  inMonth: boolean
  tasks: Task[]
  externalEvents: ExternalEvent[]
  projectColors: Map<number, string>
  onTaskClick?: (task: Task) => void
}) {
  const { t } = useLanguage()
  const isDesktop = useIsDesktop()
  const { setNodeRef, isOver } = useDroppable({
    id: `month-slot-${date.toDateString()}`,
    data: { date, hour: 9 },
  })
  const isToday = isSameDay(date, new Date())
  const overflow = Math.max(tasks.length - MAX_VISIBLE_DESKTOP, 0)

  return (
    <div
      ref={setNodeRef}
      className={[
        'flex min-h-0 flex-col gap-1 border-b border-l border-hairline p-1.5 first:border-l-0 md:p-2',
        isOver ? 'bg-accent-soft' : inMonth ? '' : 'bg-black/[0.02]',
      ].join(' ')}
    >
      <span
        className={[
          'flex size-5 items-center justify-center rounded-full text-[11px] font-semibold md:size-6 md:text-[12px]',
          isToday ? 'bg-accent text-bg' : inMonth ? 'text-text' : 'text-text-tertiary',
        ].join(' ')}
      >
        {date.getDate()}
      </span>

      {isDesktop ? (
        <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
          {externalEvents.slice(0, MAX_VISIBLE_DESKTOP).map((e) => (
            <div
              key={e.id}
              className="truncate rounded border border-dashed border-text-tertiary/50 px-1 py-0.5 text-[10px] text-text-secondary"
              title={`${e.title} — ${e.calendar} (read-only)`}
            >
              {e.title}
            </div>
          ))}
          {tasks.slice(0, MAX_VISIBLE_DESKTOP).map((t) => (
            <MonthTaskChip
              key={t.id}
              task={t}
              color={projectColors.get(t.project_id) ?? '#3c6e90'}
              onClick={onTaskClick ? () => onTaskClick(t) : undefined}
            />
          ))}
          {overflow > 0 && <span className="px-1 text-[10px] text-text-tertiary">{t.calendar.moreCount(overflow)}</span>}
        </div>
      ) : (
        tasks.length > 0 && (
          <div className="flex flex-wrap gap-0.5">
            {tasks.slice(0, 6).map((t) => (
              <span
                key={t.id}
                className="size-1.5 rounded-full"
                style={{ backgroundColor: projectColors.get(t.project_id) ?? '#3c6e90' }}
              />
            ))}
          </div>
        )
      )}
    </div>
  )
}

export default function MonthGrid({
  monthDate,
  tasksByDay,
  externalByDay,
  projectColors,
  onTaskClick,
}: {
  monthDate: Date
  tasksByDay: Map<string, Task[]>
  externalByDay: Map<string, ExternalEvent[]>
  projectColors: Map<number, string>
  onTaskClick?: (task: Task) => void
}) {
  const { t } = useLanguage()
  const days = getMonthGridDays(monthDate)

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="grid grid-cols-7 border-b border-hairline">
        {t.weekdaysShort.map((label) => (
          <div key={label} className="py-1.5 text-center text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
            {label}
          </div>
        ))}
      </div>
      <div className="grid flex-1 grid-cols-7" style={{ gridAutoRows: 'minmax(64px, 1fr)' }}>
        {days.map((d) => {
          const key = dateKey(d)
          return (
            <MonthDayCell
              key={key}
              date={d}
              inMonth={d.getMonth() === monthDate.getMonth()}
              tasks={tasksByDay.get(key) ?? []}
              externalEvents={externalByDay.get(key) ?? []}
              projectColors={projectColors}
              onTaskClick={onTaskClick}
            />
          )
        })}
      </div>
    </div>
  )
}
