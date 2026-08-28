import { useDroppable } from '@dnd-kit/core'
import { useEffect, useState } from 'react'
import type { ExternalEvent, Task } from '../../api/types'
import { isSameDay } from '../../lib/date'
import { taskColor } from '../../lib/colors'
import { CalendarTaskBlock, ExternalEventBlock, HOUR_HEIGHT } from './EventBlocks'

const HOURS = Array.from({ length: 24 }, (_, i) => i)

function HourCell({ date, hour }: { date: Date; hour: number }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${date.toDateString()}-${hour}`,
    data: { date, hour },
  })
  return (
    <div
      ref={setNodeRef}
      style={{ height: HOUR_HEIGHT }}
      className={['border-b border-hairline', isOver ? 'bg-accent-soft' : ''].join(' ')}
    />
  )
}

function NowIndicator() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])
  const top = (now.getHours() + now.getMinutes() / 60) * HOUR_HEIGHT
  return (
    <div style={{ top }} className="pointer-events-none absolute inset-x-0 z-10 flex items-center">
      <span className="-ml-1 size-2 shrink-0 rounded-full bg-clay" />
      <span className="h-px w-full bg-clay/70" />
    </div>
  )
}

export default function DayColumn({
  date,
  tasks,
  externalEvents,
  projectColors,
  onTaskClick,
}: {
  date: Date
  tasks: Task[]
  externalEvents: ExternalEvent[]
  projectColors: Map<number, string>
  onTaskClick?: (task: Task) => void
}) {
  return (
    <div className="relative flex-1 border-l border-hairline first:border-l-0">
      {HOURS.map((h) => (
        <HourCell key={h} date={date} hour={h} />
      ))}
      <div className="pointer-events-none absolute inset-0">
        {externalEvents.map((e) => (
          <ExternalEventBlock key={e.id} event={e} />
        ))}
        {tasks.map((t) => (
          <CalendarTaskBlock
            key={t.id}
            task={t}
            color={taskColor(t, projectColors)}
            onClick={onTaskClick ? () => onTaskClick(t) : undefined}
          />
        ))}
        {isSameDay(date, new Date()) && <NowIndicator />}
      </div>
    </div>
  )
}
