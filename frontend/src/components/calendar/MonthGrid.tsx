import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import type { ExternalEvent, Task } from '../../api/types'
import { useLanguage } from '../../i18n/LanguageContext'
import { dateKey, getMonthCells, isSameDay } from '../../lib/date'
import { taskColor } from '../../lib/colors'
import { useIsDesktop } from '../../lib/useIsDesktop'
import Modal from '../Modal'

const MAX_VISIBLE_DESKTOP = 5

/** Mon–Fri get equal width; Sat/Sun are narrower, giving weekdays more room
 * for event chips. Shared between the sticky header and every month body so
 * columns stay aligned. Each track uses minmax(0, …) rather than a bare
 * fr unit — otherwise a long event name (rendered nowrap for truncation)
 * sets an implicit content-based minimum width on its column, so column
 * widths would shift with whatever text happens to be in them that day. */
export const MONTH_GRID_COLUMNS = 'repeat(5, minmax(0, 1fr)) minmax(0, 0.7fr) minmax(0, 0.7fr)'

function MonthTaskChip({ task, color, onClick }: { task: Task; color: string; onClick?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `month-task-${task.id}`,
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
        'touch-none cursor-pointer truncate rounded px-1 py-0.5 text-left text-[10px] font-medium',
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
  onExternalEventClick,
  onShowMore,
}: {
  date: Date
  inMonth: boolean
  tasks: Task[]
  externalEvents: ExternalEvent[]
  projectColors: Map<number, string>
  onTaskClick?: (task: Task) => void
  onExternalEventClick?: (event: ExternalEvent) => void
  onShowMore?: () => void
}) {
  const { t } = useLanguage()
  const isDesktop = useIsDesktop()
  const { setNodeRef, isOver } = useDroppable({
    id: `month-slot-${date.toDateString()}`,
    data: { date, hour: 9 },
  })
  const isToday = isSameDay(date, new Date())
  // Total lines (chips + a "+N more" row, if any) are capped at MAX_VISIBLE_DESKTOP so a
  // cell's content always fits its fixed row height — never grows it, which used to make
  // whole weeks jump around as events/meetings were added.
  const total = externalEvents.length + tasks.length
  const slots = total > MAX_VISIBLE_DESKTOP ? MAX_VISIBLE_DESKTOP - 1 : MAX_VISIBLE_DESKTOP
  const shownExternal = Math.min(externalEvents.length, slots)
  const shownTasks = Math.min(tasks.length, slots - shownExternal)
  const overflow = total - shownExternal - shownTasks

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
          'flex size-4 items-center justify-center rounded-full text-[10px] font-semibold md:size-5 md:text-[11px]',
          isToday ? 'bg-accent text-bg' : inMonth ? 'text-text' : 'text-text-tertiary',
        ].join(' ')}
      >
        {date.getDate()}
      </span>

      {isDesktop ? (
        <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
          {externalEvents.slice(0, shownExternal).map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={onExternalEventClick ? () => onExternalEventClick(e) : undefined}
              style={e.calendar_color ? { backgroundColor: `${e.calendar_color}1f`, borderColor: `${e.calendar_color}80` } : undefined}
              className={[
                'cursor-pointer truncate rounded border border-dashed px-1 py-0.5 text-left text-[10px] text-text-secondary',
                e.calendar_color ? '' : 'border-text-tertiary/50',
              ].join(' ')}
              title={`${e.title} — ${e.calendar} (read-only)`}
            >
              {e.title}
            </button>
          ))}
          {tasks.slice(0, shownTasks).map((t) => (
            <MonthTaskChip
              key={t.id}
              task={t}
              color={taskColor(t, projectColors)}
              onClick={onTaskClick ? () => onTaskClick(t) : undefined}
            />
          ))}
          {overflow > 0 && (
            <button
              type="button"
              onClick={onShowMore}
              className="rounded px-1 py-0.5 text-left text-[10px] font-medium text-text-tertiary hover:text-text-secondary hover:underline"
            >
              {t.calendar.moreCount(overflow)}
            </button>
          )}
        </div>
      ) : (
        tasks.length > 0 && (
          <div className="flex flex-wrap gap-0.5">
            {tasks.slice(0, 6).map((t) => (
              <span
                key={t.id}
                className="size-1.5 rounded-full"
                style={{ backgroundColor: taskColor(t, projectColors) }}
              />
            ))}
          </div>
        )
      )}
    </div>
  )
}

function DayOverviewModal({
  date,
  tasks,
  externalEvents,
  projectColors,
  onClose,
  onTaskClick,
  onExternalEventClick,
}: {
  date: Date
  tasks: Task[]
  externalEvents: ExternalEvent[]
  projectColors: Map<number, string>
  onClose: () => void
  onTaskClick?: (task: Task) => void
  onExternalEventClick?: (event: ExternalEvent) => void
}) {
  const { t, locale } = useLanguage()
  return (
    <Modal
      onClose={onClose}
      header={
        <span className="text-[15px] font-semibold text-text">
          {date.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' })}
        </span>
      }
    >
      <div className="flex flex-col gap-1.5">
        {externalEvents.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => {
              onClose()
              onExternalEventClick?.(e)
            }}
            style={e.calendar_color ? { backgroundColor: `${e.calendar_color}1f`, borderColor: `${e.calendar_color}80` } : undefined}
            className={[
              'truncate rounded-lg border border-dashed px-2.5 py-2 text-left text-[13px] text-text-secondary',
              e.calendar_color ? '' : 'border-text-tertiary/50',
            ].join(' ')}
            title={`${e.title} — ${e.calendar} (read-only)`}
          >
            {e.title}
          </button>
        ))}
        {tasks.map((task) => (
          <button
            key={task.id}
            type="button"
            onClick={() => {
              onClose()
              onTaskClick?.(task)
            }}
            style={{ backgroundColor: `${taskColor(task, projectColors)}1f`, color: taskColor(task, projectColors) }}
            className={[
              'truncate rounded-lg px-2.5 py-2 text-left text-[13px] font-medium',
              task.status === 'done' ? 'opacity-50 line-through' : '',
            ].join(' ')}
          >
            {task.title}
          </button>
        ))}
        {tasks.length === 0 && externalEvents.length === 0 && (
          <p className="px-1 text-[13px] text-text-tertiary">{t.calendar.nothingUnscheduled}</p>
        )}
      </div>
    </Modal>
  )
}

/** Mon–Sun labels — shared/sticky across all months in MonthScroller rather than repeated per month. */
export function MonthWeekdayHeader() {
  const { t } = useLanguage()
  return (
    <div className="grid border-b border-hairline bg-bg" style={{ gridTemplateColumns: MONTH_GRID_COLUMNS }}>
      {t.weekdaysShort.map((label) => (
        <div key={label} className="py-1.5 text-center text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
          {label}
        </div>
      ))}
    </div>
  )
}

/** One month's day grid, without its own weekday header — used standalone or stacked in MonthScroller. */
export function MonthGridBody({
  monthDate,
  tasksByDay,
  externalByDay,
  projectColors,
  onTaskClick,
  onExternalEventClick,
}: {
  monthDate: Date
  tasksByDay: Map<string, Task[]>
  externalByDay: Map<string, ExternalEvent[]>
  projectColors: Map<number, string>
  onTaskClick?: (task: Task) => void
  onExternalEventClick?: (event: ExternalEvent) => void
}) {
  const cells = getMonthCells(monthDate)
  const [expandedDay, setExpandedDay] = useState<Date | null>(null)
  const expandedKey = expandedDay ? dateKey(expandedDay) : null

  return (
    <>
      <div className="grid auto-rows-[64px] md:auto-rows-[156px]" style={{ gridTemplateColumns: MONTH_GRID_COLUMNS }}>
        {cells.map((d, i) => {
          if (!d) return <div key={`blank-${i}`} className="border-b border-l border-hairline bg-black/[0.02] first:border-l-0" />
          const key = dateKey(d)
          return (
            <MonthDayCell
              key={key}
              date={d}
              inMonth
              tasks={tasksByDay.get(key) ?? []}
              externalEvents={externalByDay.get(key) ?? []}
              projectColors={projectColors}
              onTaskClick={onTaskClick}
              onExternalEventClick={onExternalEventClick}
              onShowMore={() => setExpandedDay(d)}
            />
          )
        })}
      </div>
      {expandedDay && expandedKey && (
        <DayOverviewModal
          date={expandedDay}
          tasks={tasksByDay.get(expandedKey) ?? []}
          externalEvents={externalByDay.get(expandedKey) ?? []}
          projectColors={projectColors}
          onClose={() => setExpandedDay(null)}
          onTaskClick={onTaskClick}
          onExternalEventClick={onExternalEventClick}
        />
      )}
    </>
  )
}
