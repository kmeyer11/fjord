import { DndContext, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { ExternalEvent, ProjectWithCounts, Task } from '../api/types'
import BacklogPanel, { BACKLOG_DROP_ID } from '../components/calendar/BacklogPanel'
import CalendarBody from '../components/calendar/CalendarBody'
import MobileDaySelector from '../components/calendar/MobileDaySelector'
import WeekHeader from '../components/calendar/WeekHeader'
import { addDays, dateKey, startOfWeek } from '../lib/date'
import { useIsDesktop } from '../lib/useIsDesktop'

export default function Calendar() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [selectedDate, setSelectedDate] = useState(() => new Date())

  const [projects, setProjects] = useState<ProjectWithCounts[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [externalEvents, setExternalEvents] = useState<ExternalEvent[]>([])
  const [error, setError] = useState<string | null>(null)

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
    const weekEnd = addDays(weekStart, 7)
    api
      .listExternalEvents(weekStart, weekEnd)
      .then(setExternalEvents)
      .catch(() => setExternalEvents([]))
  }, [weekStart])

  function goToWeek(newStart: Date) {
    const offset = (selectedDate.getDay() + 6) % 7 // Monday-indexed offset within the week
    setWeekStart(newStart)
    setSelectedDate(addDays(newStart, offset))
  }

  const projectColors = new Map(projects.map((p) => [p.id, p.color]))

  const tasksByDay = new Map<string, Task[]>()
  const backlogTasks: Task[] = []
  for (const task of tasks) {
    if (task.due_at) {
      const key = dateKey(new Date(task.due_at))
      tasksByDay.set(key, [...(tasksByDay.get(key) ?? []), task])
    } else if (task.status === 'backlog') {
      backlogTasks.push(task)
    }
  }

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
      if (task.status !== 'backlog') update = { status: 'backlog', due_at: null }
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

  if (error) return <p className="p-4 text-sm text-clay md:p-8">{error}</p>

  const bodyDays = isDesktop ? Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)) : [selectedDate]

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex h-full">
        <div className="flex min-h-0 flex-1 flex-col">
          <WeekHeader
            weekStart={weekStart}
            onPrev={() => goToWeek(addDays(weekStart, -7))}
            onNext={() => goToWeek(addDays(weekStart, 7))}
            onToday={() => {
              const today = new Date()
              setWeekStart(startOfWeek(today))
              setSelectedDate(today)
            }}
          />
          <MobileDaySelector weekStart={weekStart} selected={selectedDate} onSelect={setSelectedDate} />
          <CalendarBody days={bodyDays} tasksByDay={tasksByDay} externalByDay={externalByDay} projectColors={projectColors} />
        </div>
        <BacklogPanel tasks={backlogTasks} projectColors={projectColors} />
      </div>
    </DndContext>
  )
}
