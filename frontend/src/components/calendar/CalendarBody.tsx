import { useEffect, useRef } from 'react'
import type { ExternalEvent, Task } from '../../api/types'
import { dateKey } from '../../lib/date'
import DayColumn from './DayColumn'
import { HOUR_HEIGHT } from './EventBlocks'
import { GUTTER_WIDTH } from './WeekHeader'

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
}: {
  days: Date[]
  tasksByDay: Map<string, Task[]>
  externalByDay: Map<string, ExternalEvent[]>
  projectColors: Map<number, string>
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 7 * HOUR_HEIGHT - 24 })
  }, [])

  return (
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
              tasks={tasksByDay.get(key) ?? []}
              externalEvents={externalByDay.get(key) ?? []}
              projectColors={projectColors}
            />
          )
        })}
      </div>
    </div>
  )
}
