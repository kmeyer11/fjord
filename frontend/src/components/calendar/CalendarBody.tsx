import { useEffect, useRef } from 'react'
import type { ExternalEvent, Task } from '../../api/types'
import { dateKey } from '../../lib/date'
import { taskColor } from '../../lib/colors'
import DayColumn from './DayColumn'
import { AllDayExternalEventChip, AllDayTaskChip, HOUR_HEIGHT } from './EventBlocks'
import { GUTTER_WIDTH } from './CalendarHeader'

const HOURS = Array.from({ length: 24 }, (_, i) => i)

function formatHour(h: number) {
  if (h === 0) return ''
  const period = h < 12 ? 'AM' : 'PM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12} ${period}`
}

export default function CalendarBody({
  days,
  tasksByDay,
  externalByDay,
  projectColors,
  onTaskClick,
  onExternalEventClick,
}: {
  days: Date[]
  tasksByDay: Map<string, Task[]>
  externalByDay: Map<string, ExternalEvent[]>
  projectColors: Map<number, string>
  onTaskClick?: (task: Task) => void
  onExternalEventClick?: (event: ExternalEvent) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 7 * HOUR_HEIGHT - 24 })
  }, [])

  const hasAllDay = days.some((d) => {
    const key = dateKey(d)
    return (tasksByDay.get(key) ?? []).some((t) => t.all_day) || (externalByDay.get(key) ?? []).some((e) => e.all_day)
  })

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {hasAllDay && (
        <div className="flex border-b border-hairline">
          <div style={{ width: GUTTER_WIDTH }} className="shrink-0" />
          {days.map((d) => {
            const key = dateKey(d)
            const allDayTasks = (tasksByDay.get(key) ?? []).filter((t) => t.all_day)
            const allDayEvents = (externalByDay.get(key) ?? []).filter((e) => e.all_day)
            return (
              <div key={key} className="flex flex-1 flex-col gap-0.5 border-l border-hairline p-1 first:border-l-0">
                {allDayEvents.map((e) => (
                  <AllDayExternalEventChip
                    key={e.id}
                    event={e}
                    onClick={onExternalEventClick ? () => onExternalEventClick(e) : undefined}
                  />
                ))}
                {allDayTasks.map((t) => (
                  <AllDayTaskChip
                    key={t.id}
                    task={t}
                    color={taskColor(t, projectColors)}
                    onClick={onTaskClick ? () => onTaskClick(t) : undefined}
                  />
                ))}
              </div>
            )
          })}
        </div>
      )}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex">
          <div style={{ width: GUTTER_WIDTH }} className="shrink-0">
            {HOURS.map((h) => (
              <div key={h} style={{ height: HOUR_HEIGHT }} className="relative">
                <span className="absolute -top-2 right-1.5 text-[10px] text-text-tertiary">{formatHour(h)}</span>
              </div>
            ))}
          </div>
          {days.map((d) => {
            const key = dateKey(d)
            return (
              <DayColumn
                key={key}
                date={d}
                tasks={(tasksByDay.get(key) ?? []).filter((t) => !t.all_day)}
                externalEvents={(externalByDay.get(key) ?? []).filter((e) => !e.all_day)}
                projectColors={projectColors}
                onTaskClick={onTaskClick}
                onExternalEventClick={onExternalEventClick}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
