import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Task } from '../../api/types'
import { useLanguage } from '../../i18n/LanguageContext'
import { taskColor } from '../../lib/colors'
import { ChevronDownIcon, RepeatIcon } from '../icons'
import NewMeetingInline from '../NewMeetingInline'

export const BACKLOG_DROP_ID = 'backlog-panel'

/**
 * Wraps a section's task list so it's independently scrollable, and shows a
 * chevron hint below it when there's more to scroll to — without it, a
 * capped-height list with overflow looks like a short, complete list.
 */
function ScrollList({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [canScrollDown, setCanScrollDown] = useState(false)

  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    setCanScrollDown(el.scrollHeight - el.scrollTop - el.clientHeight > 1)
  }, [])

  useEffect(() => {
    update()
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [update, children])

  // On mobile this section is one row of a horizontal drag strip (see
  // BacklogPanel below), so `contents` keeps this wrapper transparent to that
  // layout there — only at md+ does it become the column-with-its-own-scroll
  // box the desktop sidebar needs.
  return (
    <div className="contents md:flex md:min-h-0 md:flex-col md:flex-1">
      <div
        ref={ref}
        onScroll={update}
        className="contents md:flex md:min-h-0 md:flex-1 md:flex-col md:gap-2 md:overflow-y-auto"
      >
        {children}
      </div>
      {canScrollDown && (
        <div className="hidden text-text-tertiary/70 md:flex md:shrink-0 md:justify-center md:pt-0.5">
          <ChevronDownIcon className="size-3" />
        </div>
      )}
    </div>
  )
}

function SectionHeader({
  title,
  expanded,
  onToggle,
}: {
  title: string
  expanded: boolean
  onToggle: () => void
}) {
  const { t } = useLanguage()
  return (
    <div className="flex shrink-0 items-center justify-between gap-2 px-1">
      <h2 className="text-[13px] font-semibold text-text-secondary">{title}</h2>
      <button
        type="button"
        onClick={onToggle}
        aria-label={expanded ? t.calendar.collapseSection : t.calendar.expandSection}
        className="-m-1 flex size-6 shrink-0 items-center justify-center rounded text-text-tertiary hover:bg-hairline/40 hover:text-text-secondary"
      >
        <ChevronDownIcon className={['size-3.5 transition-transform', expanded ? '' : '-rotate-90'].join(' ')} />
      </button>
    </div>
  )
}

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
    id: `backlog-task-${task.id}`,
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
  // Meetings is the most-used section, so it always gets the top half of the
  // panel and starts open. Backlog and Scheduled share the bottom half (and
  // don't render at all when empty — see below); both start open too, but
  // collapsing one lets the other grow into the freed space (flex-1 vs.
  // shrink-to-header below).
  const [meetingsOpen, setMeetingsOpen] = useState(true)
  const [backlogOpen, setBacklogOpen] = useState(true)
  const [scheduledOpen, setScheduledOpen] = useState(true)

  const showBacklog = backlogTasks.length > 0
  const showScheduled = scheduledTasks.length > 0

  return (
    <div
      ref={setNodeRef}
      className={[
        'hidden md:flex md:static md:inset-auto md:bottom-auto md:z-auto md:w-64 md:shrink-0 md:flex-col md:gap-0 md:overflow-hidden md:border-l md:border-t-0 md:p-3 md:backdrop-blur-none',
        isOver ? 'bg-accent-soft' : 'md:bg-surface/40',
      ].join(' ')}
    >
      <div className="flex flex-col gap-2 md:min-h-0 md:flex-1">
        <SectionHeader title={t.calendar.meetings} expanded={meetingsOpen} onToggle={() => setMeetingsOpen((v) => !v)} />
        {meetingsOpen && (
          <>
            <div className="shrink-0">
              <NewMeetingInline onCreate={onCreateMeeting} />
            </div>
            <ScrollList>
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
            </ScrollList>
          </>
        )}
      </div>

      {(showBacklog || showScheduled) && (
        <div className="flex flex-col md:min-h-0 md:flex-1 md:mt-3 md:border-t md:border-hairline md:pt-3">
          {showBacklog && (
            <div
              className={[
                'flex flex-col gap-2 md:min-h-0',
                backlogOpen ? 'md:flex-1' : 'md:shrink-0',
              ].join(' ')}
            >
              <SectionHeader
                title={t.calendar.backlog}
                expanded={backlogOpen}
                onToggle={() => setBacklogOpen((v) => !v)}
              />
              {backlogOpen && (
                <ScrollList>
                  {backlogTasks.map((task) => (
                    <DraggableTask
                      key={task.id}
                      task={task}
                      color={taskColor(task, projectColors)}
                      onClick={onTaskClick ? () => onTaskClick(task) : undefined}
                    />
                  ))}
                </ScrollList>
              )}
            </div>
          )}

          {showScheduled && (
            <div
              className={[
                'flex flex-col gap-2 md:min-h-0',
                scheduledOpen ? 'md:flex-1' : 'md:shrink-0',
                showBacklog ? 'md:mt-3 md:border-t md:border-hairline md:pt-3' : '',
              ].join(' ')}
            >
              <SectionHeader
                title={t.calendar.scheduled}
                expanded={scheduledOpen}
                onToggle={() => setScheduledOpen((v) => !v)}
              />
              {scheduledOpen && (
                <ScrollList>
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
                </ScrollList>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
