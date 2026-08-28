import { addDays, formatWeekRange, isSameDay, WEEKDAY_LABELS } from '../../lib/date'
import { ChevronLeftIcon } from '../icons'

export const GUTTER_WIDTH = 48

export default function WeekHeader({
  weekStart,
  onPrev,
  onNext,
  onToday,
}: {
  weekStart: Date
  onPrev: () => void
  onNext: () => void
  onToday: () => void
}) {
  const today = new Date()
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="border-b border-hairline bg-surface/70 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 pt-3 md:px-6">
        <div className="flex items-center gap-1">
          <button onClick={onPrev} className="rounded-full p-1.5 text-accent hover:bg-black/[0.04]" aria-label="Previous week">
            <ChevronLeftIcon className="size-5" />
          </button>
          <button onClick={onNext} className="rounded-full p-1.5 text-accent hover:bg-black/[0.04]" aria-label="Next week">
            <ChevronLeftIcon className="size-5 rotate-180" />
          </button>
          <span className="ml-1 text-[15px] font-semibold text-text">{formatWeekRange(weekStart)}</span>
        </div>
        <button
          onClick={onToday}
          className="rounded-full border border-hairline px-3 py-1 text-[13px] font-medium text-text-secondary hover:bg-black/[0.04]"
        >
          Today
        </button>
      </div>

      {/* Desktop: full 7-day header, column widths matching CalendarBody exactly. */}
      <div className="mt-3 hidden md:flex">
        <div style={{ width: GUTTER_WIDTH }} className="shrink-0" />
        {days.map((d, i) => {
          const isToday = isSameDay(d, today)
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-0.5 border-l border-hairline py-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">{WEEKDAY_LABELS[i]}</span>
              <span
                className={[
                  'flex size-6 items-center justify-center rounded-full text-[13px] font-semibold',
                  isToday ? 'bg-accent text-bg' : 'text-text',
                ].join(' ')}
              >
                {d.getDate()}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
