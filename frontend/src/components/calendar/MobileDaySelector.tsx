import { addDays, isSameDay, WEEKDAY_LABELS } from '../../lib/date'

export default function MobileDaySelector({
  weekStart,
  selected,
  onSelect,
}: {
  weekStart: Date
  selected: Date
  onSelect: (date: Date) => void
}) {
  const today = new Date()
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="flex justify-between gap-1 border-b border-hairline bg-surface/70 px-3 py-2 backdrop-blur-xl md:hidden">
      {days.map((d, i) => {
        const isToday = isSameDay(d, today)
        const isSelected = isSameDay(d, selected)
        return (
          <button
            key={i}
            onClick={() => onSelect(d)}
            className="flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5"
          >
            <span className="text-[10px] font-medium uppercase tracking-wide text-text-tertiary">{WEEKDAY_LABELS[i]}</span>
            <span
              className={[
                'flex size-7 items-center justify-center rounded-full text-[13px] font-semibold',
                isSelected ? 'bg-accent text-bg' : isToday ? 'text-accent' : 'text-text',
              ].join(' ')}
            >
              {d.getDate()}
            </span>
          </button>
        )
      })}
    </div>
  )
}
