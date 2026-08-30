import { DndContext, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { ExternalEvent, ProjectWithCounts, Task } from '../api/types'
import BacklogPanel, { BACKLOG_DROP_ID } from '../components/calendar/BacklogPanel'
import CalendarBody from '../components/calendar/CalendarBody'
import CalendarHeader, { type CalendarViewMode } from '../components/calendar/CalendarHeader'
import MobileDaySelector from '../components/calendar/MobileDaySelector'
import MonthGrid from '../components/calendar/MonthGrid'
import ExternalEventDetailModal from '../components/ExternalEventDetailModal'
import TaskDetailModal from '../components/TaskDetailModal'
import { useLanguage } from '../i18n/LanguageContext'
import {
  addDays,
  dateKey,
  formatMonth,
  formatWeekRange,
  getMonthGridDays,
  startOfMonth,
  startOfWeek,
} from '../lib/date'
import { useIsDesktop } from '../lib/useIsDesktop'

export default function Calendar() {
  const { t, locale } = useLanguage()
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month')
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [monthDate, setMonthDate] = useState(() => startOfMonth(new Date()))

  const [projects, setProjects] = useState<ProjectWithCounts[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [externalEvents, setExternalEvents] = useState<ExternalEvent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [viewingExternalEvent, setViewingExternalEvent] = useState<ExternalEvent | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  )
  const isDesktop = useIsDesktop()

  function reloadTasks() {
    Promise.all([api.listProjects(), api.listTasks()])
      .then(([p, t]) => {
        setProjects(p)
        setTasks(t)
      })
      .catch((e) => setError(String(e)))
  }

  useEffect(reloadTasks, [])

  useEffect(() => {
    const [rangeStart, rangeEnd] =
      viewMode === 'week'
        ? [weekStart, addDays(weekStart, 7)]
        : (() => {
            const days = getMonthGridDays(monthDate)
            return [days[0], addDays(days[days.length - 1], 1)]
          })()

    api
      .listExternalEvents(rangeStart, rangeEnd)
      .then(setExternalEvents)
      .catch(() => setExternalEvents([]))
  }, [viewMode, weekStart, monthDate])

  function goToWeek(newStart: Date) {
    const offset = (selectedDate.getDay() + 6) % 7 // Monday-indexed offset within the week
    setWeekStart(newStart)
    setSelectedDate(addDays(newStart, offset))
  }

  function goToMonth(newMonth: Date) {
    setMonthDate(startOfMonth(newMonth))
  }

  const projectColors = new Map(projects.map((p) => [p.id, p.color]))

  const tasksByDay = new Map<string, Task[]>()
  const backlogTasks: Task[] = []
  const scheduledTasks: Task[] = []
  const meetingTasksRaw: Task[] = []
  for (const task of tasks) {
    if (task.due_at) {
      const key = dateKey(new Date(task.due_at))
      tasksByDay.set(key, [...(tasksByDay.get(key) ?? []), task])
      if (task.category === 'meeting') {
        // A recurring series materializes many rows into the future — only
        // surface upcoming ones here, or the sidebar list grows unbounded.
        const isPastRecurrence = task.recurrence_id && new Date(task.due_at) < new Date()
        if (!isPastRecurrence) meetingTasksRaw.push(task)
      } else if (task.status === 'scheduled') {
        scheduledTasks.push(task)
      }
    } else if (task.status === 'backlog') {
      backlogTasks.push(task)
    }
  }
  // A recurring series is one meeting, not N — collapse it to its next
  // upcoming occurrence; the calendar grid still shows every individual date.
  const seenSeries = new Set<string>()
  const meetingTasks = meetingTasksRaw
    .slice()
    .sort((a, b) => (a.due_at ?? '').localeCompare(b.due_at ?? ''))
    .filter((task) => {
      if (!task.recurrence_id) return true
      if (seenSeries.has(task.recurrence_id)) return false
      seenSeries.add(task.recurrence_id)
      return true
    })

  const externalByDay = new Map<string, ExternalEvent[]>()
  for (const event of externalEvents) {
    const key = dateKey(new Date(event.start))
    externalByDay.set(key, [...(externalByDay.get(key) ?? []), event])
  }

  async function handleDragEnd(event: DragEndEvent) {
    const task = event.active.data.current?.task as Task | undefined
    if (!task || !event.over) return

    let update: Partial<Pick<Task, 'status' | 'due_at'>> | null = null

    if (event.over.id === BACKLOG_DROP_ID) {
      // Meetings have no backlog state — dropping one here would strand it
      // off the calendar grid with no way back except editing its date.
      if (task.category !== 'meeting' && task.status !== 'backlog') update = { status: 'backlog', due_at: null }
    } else {
      const slot = event.over.data.current as { date: Date; hour: number } | undefined
      if (slot) {
        const due = new Date(slot.date)
        due.setHours(slot.hour, 0, 0, 0)
        update = { status: 'scheduled', due_at: due.toISOString() }
      }
    }

    if (!update) return

    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, ...update } : t)))
    try {
      await api.updateTask(task.id, update)
    } catch (e) {
      setError(String(e))
      reloadTasks()
    }
  }

  if (error)
    return (
      <p className="p-4 text-sm text-clay md:p-8">
        {t.calendar.loadError}: {error}
      </p>
    )

  const bodyDays = isDesktop ? Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)) : [selectedDate]
  const label = viewMode === 'week' ? formatWeekRange(weekStart, locale) : formatMonth(monthDate, locale)

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex h-full">
        <div className="flex min-h-0 flex-1 flex-col">
          <CalendarHeader
            label={label}
            weekStart={weekStart}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onPrev={() => (viewMode === 'week' ? goToWeek(addDays(weekStart, -7)) : goToMonth(addDays(monthDate, -1)))}
            onNext={() => (viewMode === 'week' ? goToWeek(addDays(weekStart, 7)) : goToMonth(addDays(monthDate, 32)))}
          />
          {viewMode === 'week' && (
            <MobileDaySelector weekStart={weekStart} selected={selectedDate} onSelect={setSelectedDate} />
          )}
          {viewMode === 'week' ? (
            <CalendarBody
              days={bodyDays}
              tasksByDay={tasksByDay}
              externalByDay={externalByDay}
              projectColors={projectColors}
              onTaskClick={setEditingTask}
              onExternalEventClick={setViewingExternalEvent}
            />
          ) : (
            <MonthGrid
              monthDate={monthDate}
              tasksByDay={tasksByDay}
              externalByDay={externalByDay}
              projectColors={projectColors}
              onTaskClick={setEditingTask}
              onExternalEventClick={setViewingExternalEvent}
            />
          )}
        </div>
        <BacklogPanel
          backlogTasks={backlogTasks}
          scheduledTasks={scheduledTasks}
          meetingTasks={meetingTasks}
          projectColors={projectColors}
          onCreateMeeting={async (data) => {
            const created = await api.createMeeting(data)
            // A recurring series adds more rows than the one returned — reload to pick them up.
            if (created.recurrence_id) reloadTasks()
            else setTasks((prev) => [...prev, created])
          }}
        />
      </div>

      {editingTask && (
        <TaskDetailModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={async (data) => {
            const wasRecurring = editingTask.recurrence_id != null
            const updated = await api.updateTask(editingTask.id, data)
            // Toggling recurrence adds/removes a whole series' worth of rows —
            // a plain in-place update of this one task can't reflect that.
            if (data.recurring !== undefined && data.recurring !== wasRecurring) reloadTasks()
            else setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
          }}
          onDelete={async (scope) => {
            await api.deleteTask(editingTask.id, scope)
            if (scope === 'future' && editingTask.recurrence_id) {
              setTasks((prev) =>
                prev.filter(
                  (t) =>
                    !(t.recurrence_id === editingTask.recurrence_id && (t.due_at ?? '') >= (editingTask.due_at ?? '')),
                ),
              )
            } else {
              setTasks((prev) => prev.filter((t) => t.id !== editingTask.id))
            }
          }}
        />
      )}

      {viewingExternalEvent && (
        <ExternalEventDetailModal event={viewingExternalEvent} onClose={() => setViewingExternalEvent(null)} />
      )}
    </DndContext>
  )
}
