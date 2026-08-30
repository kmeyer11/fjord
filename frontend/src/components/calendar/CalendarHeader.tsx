import { useLanguage } from '../../i18n/LanguageContext'
import { addDays, isSameDay } from '../../lib/date'
import { ChevronLeftIcon } from '../icons'

export const GUTTER_WIDTH = 48

export type CalendarViewMode = 'week' | 'month'

function ViewModeToggle({ mode, onChange }: { mode: CalendarViewMode; onChange: (mode: CalendarViewMode) => void }) {
  const { t } = useLanguage()
  const modes: { value: CalendarViewMode; label: string }[] = [
    { value: 'week', label: t.calendar.week },
    { value: 'month', label: t.calendar.month },
  ]

  return (
    <div className="flex rounded-full border border-hairline bg-surface p-0.5 text-[13px] font-medium">
      {modes.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={[
            'rounded-full px-3 py-1 transition-colors',
            mode === value ? 'bg-accent text-bg' : 'text-text-secondary',
          ].join(' ')}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export default function CalendarHeader({
  label,
  weekStart,
  viewMode,
  onViewModeChange,
  onPrev,
  onNext,
}: {
  label: string
  weekStart: Date
  viewMode: CalendarViewMode
  onViewModeChange: (mode: CalendarViewMode) => void
  onPrev: () => void
  onNext: () => void
}) {
  const { t } = useLanguage()
  const today = new Date()
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="border-b border-hairline bg-surface/70 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 pt-3 md:px-6">
        <div className="flex items-center gap-1">
          <button onClick={onPrev} className="rounded-full p-1.5 text-accent hover:bg-black/[0.04]" aria-label={t.calendar.previous}>
            <ChevronLeftIcon className="size-5" />
          </button>
          <button onClick={onNext} className="rounded-full p-1.5 text-accent hover:bg-black/[0.04]" aria-label={t.calendar.next}>
            <ChevronLeftIcon className="size-5 rotate-180" />
          </button>
          <span className="ml-1 text-[15px] font-semibold text-text">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <ViewModeToggle mode={viewMode} onChange={onViewModeChange} />
        </div>
      </div>

      {/* Desktop week view only — month view renders its own weekday header (MonthGrid). */}
      {viewMode === 'week' && (
        <div className="mt-3 hidden md:flex">
          <div style={{ width: GUTTER_WIDTH }} className="shrink-0" />
          {days.map((d, i) => {
            const isToday = isSameDay(d, today)
            return (
              <div key={i} className="flex flex-1 flex-col items-center gap-0.5 border-l border-hairline py-1.5">
                <span className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">{t.weekdaysShort[i]}</span>
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
      )}
    </div>
  )
}
