import { DndContext, PointerSensor, TouchSensor, pointerWithin, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { ExternalEvent, ProjectWithCounts, Task } from '../api/types'
import CalendarBody from '../components/calendar/CalendarBody'
import CalendarHeader, { type CalendarViewMode } from '../components/calendar/CalendarHeader'
import MeetingsPanel from '../components/calendar/MeetingsPanel'
import MobileDaySelector from '../components/calendar/MobileDaySelector'
import MonthScroller from '../components/calendar/MonthScroller'
import ExternalEventDetailModal from '../components/ExternalEventDetailModal'
import NewMeetingModal from '../components/NewMeetingModal'
import SeriesEditModal from '../components/SeriesEditModal'
import TaskDetailModal from '../components/TaskDetailModal'
import { useLanguage } from '../i18n/LanguageContext'
import { addDays, addMonths, dateKey, formatMonth, formatWeekRange, startOfMonth, startOfWeek } from '../lib/date'
import { useIsDesktop } from '../lib/useIsDesktop'

export default function Calendar() {
  const { t, locale } = useLanguage()
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month')
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [monthDate, setMonthDate] = useState(() => startOfMonth(new Date()))
  // Range of months MonthScroller actually has rendered — it grows as the
  // user scrolls, so external events are fetched for whatever that is.
  const [monthRange, setMonthRange] = useState<[Date, Date] | null>(null)

  const [projects, setProjects] = useState<ProjectWithCounts[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [externalEvents, setExternalEvents] = useState<ExternalEvent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editingSeries, setEditingSeries] = useState<Task | null>(null)
  const [viewingExternalEvent, setViewingExternalEvent] = useState<ExternalEvent | null>(null)
  const [newMeetingDate, setNewMeetingDate] = useState<Date | null>(null)

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

  async function createMeeting(data: { title: string; due_at: string; all_day?: boolean; recurring?: boolean }) {
    const created = await api.createMeeting(data)
    // A recurring series adds more rows than the one returned — reload to pick them up.
    if (created.recurrence_id) reloadTasks()
    else setTasks((prev) => [...prev, created])
  }

  useEffect(() => {
    // Month view scrolls continuously (see MonthScroller) and grows the
    // rendered range as the user scrolls — fetch events for whatever range
    // it reports rather than just the active month.
    if (viewMode === 'week') {
      api
        .listExternalEvents(weekStart, addDays(weekStart, 7))
        .then(setExternalEvents)
        .catch(() => setExternalEvents([]))
      return
    }
    if (!monthRange) return
    api
      .listExternalEvents(monthRange[0], monthRange[1])
      .then(setExternalEvents)
      .catch(() => setExternalEvents([]))
  }, [viewMode, weekStart, monthRange])

  function goToWeek(newStart: Date) {
    const offset = (selectedDate.getDay() + 6) % 7 // Monday-indexed offset within the week
    setWeekStart(newStart)
    setSelectedDate(addDays(newStart, offset))
  }

  function goToMonth(newMonth: Date) {
    setMonthDate(startOfMonth(newMonth))
  }

  const projectColors = new Map(projects.map((p) => [p.id, p.color]))

  // The calendar only ever shows meetings — regular tasks live entirely in
  // the project/Kanban board, so they're filtered out here rather than
  // bucketed into the grid or the sidebar.
  const tasksByDay = new Map<string, Task[]>()
  const meetingTasksRaw: Task[] = []
  const now = new Date()
  const todayKey = dateKey(now)
  for (const task of tasks) {
    if (task.category !== 'meeting' || !task.due_at) continue
    const key = dateKey(new Date(task.due_at))
    tasksByDay.set(key, [...(tasksByDay.get(key) ?? []), task])
    // The sidebar lists what's coming up; past meetings stay on the grid
    // only. An all-day meeting counts as past once its day is over, not at
    // midnight when it starts.
    const isPast = task.all_day ? key < todayKey : new Date(task.due_at) < now
    if (!isPast) meetingTasksRaw.push(task)
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

  // The only thing left draggable on the calendar is a meeting chip, dropped
  // onto a new day/hour slot to reschedule it.
  async function handleDragEnd(event: DragEndEvent) {
    const task = event.active.data.current?.task as Task | undefined
    const slot = event.over?.data.current as { date: Date; hour: number } | undefined
    if (!task || !slot) return

    const due = new Date(slot.date)
    // An all-day meeting only changes day — keep it at local midnight.
    due.setHours(task.all_day ? 0 : slot.hour, 0, 0, 0)
    const update: Partial<Pick<Task, 'due_at'>> = { due_at: due.toISOString() }

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
    <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
      <div className="flex h-full">
        <div className="flex min-h-0 flex-1 flex-col">
          <CalendarHeader
            label={label}
            weekStart={weekStart}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onPrev={() => (viewMode === 'week' ? goToWeek(addDays(weekStart, -7)) : goToMonth(addMonths(monthDate, -1)))}
            onNext={() => (viewMode === 'week' ? goToWeek(addDays(weekStart, 7)) : goToMonth(addMonths(monthDate, 1)))}
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
              onCreateAt={setNewMeetingDate}
            />
          ) : (
            <MonthScroller
              activeMonth={monthDate}
              onActiveMonthChange={goToMonth}
              onRangeChange={(start, end) => setMonthRange([start, end])}
              tasksByDay={tasksByDay}
              externalByDay={externalByDay}
              projectColors={projectColors}
              onTaskClick={setEditingTask}
              onExternalEventClick={setViewingExternalEvent}
              onCreateAt={setNewMeetingDate}
            />
          )}
        </div>
        <MeetingsPanel
          meetingTasks={meetingTasks}
          projectColors={projectColors}
          onTaskClick={setEditingTask}
          onEditSeries={setEditingSeries}
          onCreateMeeting={createMeeting}
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

      {newMeetingDate && (
        <NewMeetingModal initialDate={newMeetingDate} onClose={() => setNewMeetingDate(null)} onCreate={createMeeting} />
      )}

      {editingSeries?.due_at && (
        <SeriesEditModal
          series={{
            recurrenceId: editingSeries.recurrence_id!,
            title: editingSeries.title,
            weekday: (new Date(editingSeries.due_at).getDay() + 6) % 7,
            hour: new Date(editingSeries.due_at).getHours(),
            minute: new Date(editingSeries.due_at).getMinutes(),
            allDay: editingSeries.all_day,
          }}
          onClose={() => setEditingSeries(null)}
          onSave={async (data) => {
            await api.updateMeetingSeries(editingSeries.recurrence_id!, data)
            reloadTasks()
          }}
          onDelete={async () => {
            await api.deleteTask(editingSeries.id, 'future')
            reloadTasks()
          }}
        />
      )}
    </DndContext>
  )
}
