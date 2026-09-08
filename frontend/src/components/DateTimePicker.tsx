import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { addMonths, dateKey, getMonthCells, isSameDay, startOfMonth, toDatetimeLocalValue } from '../lib/date'
import { CalendarIcon, ChevronLeftIcon, ClockIcon } from './icons'

/** Every quarter-hour in a day — the granularity the time panel offers. */
const TIME_STEPS = Array.from({ length: 96 }, (_, i) => ({ hour: Math.floor(i / 4), minute: (i % 4) * 15 }))

/** Parses the same wall-clock string shape <input type="date"/"datetime-local"> uses. */
function parseValue(value: string): Date | null {
  if (!value) return null
  const [datePart, timePart] = value.split('T')
  const [y, m, d] = datePart.split('-').map(Number)
  if (!y || !m || !d) return null
  const date = new Date(y, m - 1, d)
  if (timePart) {
    const [hh, mm] = timePart.split(':').map(Number)
    if (!Number.isNaN(hh)) date.setHours(hh, Number.isNaN(mm) ? 0 : mm, 0, 0)
  }
  return date
}

function formatValue(date: Date, allDay: boolean): string {
  return allDay ? dateKey(date) : toDatetimeLocalValue(date)
}

/**
 * Renders `children` into a fixed-position portal anchored below (or, if
 * there's no room, above) `anchorRef`, and closes itself on an outside click
 * or Escape. Portaling to <body> sidesteps clipping from ancestors with
 * overflow-hidden/auto (the calendar sidebar, the modal sheet) that a plain
 * absolutely-positioned dropdown would get cut off by.
 */
function FloatingPanel({
  anchorRef,
  onClose,
  widthClass,
  children,
}: {
  anchorRef: RefObject<HTMLElement | null>
  onClose: () => void
  widthClass: string
  children: ReactNode
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState<{ top: number; left: number } | null>(null)

  useLayoutEffect(() => {
    function reposition() {
      const anchor = anchorRef.current
      const panel = panelRef.current
      if (!anchor || !panel) return
      const margin = 8
      const anchorRect = anchor.getBoundingClientRect()
      const panelRect = panel.getBoundingClientRect()

      let top = anchorRect.bottom + margin
      if (top + panelRect.height > window.innerHeight - margin) {
        top = Math.max(margin, anchorRect.top - panelRect.height - margin)
      }
      let left = anchorRect.left
      left = Math.min(left, window.innerWidth - panelRect.width - margin)
      left = Math.max(left, margin)
      setStyle({ top, left })
    }
    reposition()
    window.addEventListener('resize', reposition)
    window.addEventListener('scroll', reposition, true)
    return () => {
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition, true)
    }
  }, [anchorRef])

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      const target = e.target as Node
      if (panelRef.current?.contains(target) || anchorRef.current?.contains(target)) return
      onClose()
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('pointerdown', handlePointerDown, true)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [anchorRef, onClose])

  return createPortal(
    <div
      ref={panelRef}
      style={{ position: 'fixed', top: style?.top ?? -9999, left: style?.left ?? -9999 }}
      className={`${widthClass} z-50 overflow-hidden rounded-2xl border border-hairline bg-surface-raised shadow-2xl`}
    >
      {children}
    </div>,
    document.body,
  )
}

function DatePanel({ selected, onSelect }: { selected: Date | null; onSelect: (day: Date) => void }) {
  const { t, locale } = useLanguage()
  const today = new Date()
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(selected ?? today))
  const cells = getMonthCells(viewMonth)
  const monthLabel = viewMonth.toLocaleDateString(locale, { month: 'long', year: 'numeric' })

  return (
    <div className="p-2.5">
      <div className="flex items-center justify-between px-0.5 pb-2">
        <button
          type="button"
          onClick={() => setViewMonth((m) => addMonths(m, -1))}
          aria-label={t.calendar.previous}
          className="rounded-full p-1 text-accent hover:bg-black/[0.04]"
        >
          <ChevronLeftIcon className="size-4" />
        </button>
        <span className="text-[13px] font-semibold capitalize text-text">{monthLabel}</span>
        <button
          type="button"
          onClick={() => setViewMonth((m) => addMonths(m, 1))}
          aria-label={t.calendar.next}
          className="rounded-full p-1 text-accent hover:bg-black/[0.04]"
        >
          <ChevronLeftIcon className="size-4 rotate-180" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {t.weekdaysShort.map((label) => (
          <div
            key={label}
            className="flex h-7 items-center justify-center text-[10px] font-medium uppercase tracking-wide text-text-tertiary"
          >
            {label}
          </div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`blank-${i}`} />
          const isToday = isSameDay(day, today)
          const isSelected = selected != null && isSameDay(day, selected)
          return (
            <button
              key={dateKey(day)}
              type="button"
              onClick={() => onSelect(day)}
              className={[
                'size-8 justify-self-center rounded-full text-[13px] font-medium transition-colors',
                isSelected
                  ? 'bg-accent text-bg'
                  : isToday
                    ? 'text-accent ring-1 ring-inset ring-accent/40'
                    : 'text-text hover:bg-black/[0.05]',
              ].join(' ')}
            >
              {day.getDate()}
            </button>
          )
        })}
      </div>
      <button
        type="button"
        onClick={() => {
          setViewMonth(startOfMonth(today))
          onSelect(today)
        }}
        className="mt-1.5 w-full rounded-lg py-1.5 text-center text-[12px] font-medium text-accent hover:bg-accent-soft"
      >
        {t.calendar.today}
      </button>
    </div>
  )
}

function pickerChipClass(active: boolean, chipClassName: string): string {
  return [
    'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[13px] font-medium text-text outline-none transition-colors disabled:opacity-50',
    active ? 'border-accent bg-accent-soft' : `border-hairline ${chipClassName} hover:bg-black/[0.03]`,
  ].join(' ')
}

/**
 * The quarter-hour picker on its own — a chip button that opens the same
 * floating time list `DateTimePicker` uses, extracted so a caller that only
 * needs a time (no date), like the recurring-series editor, can reuse it
 * instead of re-implementing the list. `open`/`onOpenChange` are controlled
 * by the caller so it can coordinate with a sibling panel (DateTimePicker
 * keeps its date and time panels mutually exclusive this way).
 */
export function TimePicker({
  value,
  onChange,
  open,
  onOpenChange,
  disabled,
  ariaLabel,
  placeholder,
  chipClassName = 'bg-surface',
}: {
  value: { hour: number; minute: number } | null
  onChange: (hour: number, minute: number) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  disabled?: boolean
  ariaLabel?: string
  placeholder: string
  chipClassName?: string
}) {
  const { locale } = useLanguage()
  const btnRef = useRef<HTMLButtonElement>(null)
  const selected = value ? new Date(2000, 0, 1, value.hour, value.minute) : null
  const label = selected ? selected.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' }) : placeholder

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => onOpenChange(!open)}
        className={pickerChipClass(open, chipClassName)}
      >
        <ClockIcon className="size-4 shrink-0 text-text-tertiary" />
        {label}
      </button>
      {open && (
        <FloatingPanel anchorRef={btnRef} onClose={() => onOpenChange(false)} widthClass="w-44">
          <TimePanel
            selected={selected}
            onSelect={(hour, minute) => {
              onChange(hour, minute)
              onOpenChange(false)
              btnRef.current?.focus()
            }}
          />
        </FloatingPanel>
      )}
    </>
  )
}

function TimePanel({ selected, onSelect }: { selected: Date | null; onSelect: (hour: number, minute: number) => void }) {
  const { locale } = useLanguage()
  const selectedRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'center' })
  }, [])

  return (
    <div className="max-h-64 overflow-y-auto p-1.5">
      {TIME_STEPS.map(({ hour, minute }) => {
        const isSelected = selected != null && selected.getHours() === hour && selected.getMinutes() === minute
        const label = new Date(2000, 0, 1, hour, minute).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })
        return (
          <button
            key={`${hour}-${minute}`}
            ref={isSelected ? selectedRef : undefined}
            type="button"
            onClick={() => onSelect(hour, minute)}
            className={[
              'block w-full rounded-lg px-3 py-1.5 text-left text-[13px] font-medium transition-colors',
              isSelected ? 'bg-accent text-bg' : 'text-text hover:bg-black/[0.05]',
            ].join(' ')}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Replaces native <input type="date"/"datetime-local">: clicking a day (or a
 * time) commits it immediately instead of leaving the browser's picker open
 * waiting for a further confirm step, and the time list is a scannable menu
 * rather than a fiddly spinner. `value`/`onChange` keep the exact string
 * shape the native inputs used (YYYY-MM-DD, or …THH:MM when not all-day) so
 * callers didn't need to change their surrounding state.
 */
export default function DateTimePicker({
  value,
  onChange,
  allDay,
  disabled,
  ariaLabel,
  chipClassName = 'bg-surface',
}: {
  value: string
  onChange: (value: string) => void
  allDay: boolean
  disabled?: boolean
  ariaLabel?: string
  chipClassName?: string
}) {
  const { t, locale } = useLanguage()
  const [openPanel, setOpenPanel] = useState<'date' | 'time' | null>(null)
  const dateBtnRef = useRef<HTMLButtonElement>(null)

  // A panel left open across an all-day toggle would otherwise reappear were
  // the toggle flipped back, without the user having clicked anything.
  const [prevAllDay, setPrevAllDay] = useState(allDay)
  if (allDay !== prevAllDay) {
    setPrevAllDay(allDay)
    setOpenPanel(null)
  }

  const selected = parseValue(value)
  const baseline = selected ?? new Date()

  function selectDate(day: Date) {
    const next = new Date(baseline)
    next.setFullYear(day.getFullYear(), day.getMonth(), day.getDate())
    onChange(formatValue(next, allDay))
    setOpenPanel(null)
    dateBtnRef.current?.focus()
  }

  function selectTime(hour: number, minute: number) {
    const next = new Date(baseline)
    next.setHours(hour, minute, 0, 0)
    onChange(formatValue(next, false))
  }

  const dateLabel = selected
    ? selected.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })
    : t.calendar.pickDate

  return (
    <div className="flex gap-1.5" role="group" aria-label={ariaLabel}>
      <button
        ref={dateBtnRef}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={openPanel === 'date'}
        onClick={() => setOpenPanel((p) => (p === 'date' ? null : 'date'))}
        className={pickerChipClass(openPanel === 'date', chipClassName)}
      >
        <CalendarIcon className="size-4 shrink-0 text-text-tertiary" />
        {dateLabel}
      </button>
      {!allDay && (
        <TimePicker
          value={selected ? { hour: selected.getHours(), minute: selected.getMinutes() } : null}
          onChange={selectTime}
          open={openPanel === 'time'}
          onOpenChange={(open) => setOpenPanel(open ? 'time' : null)}
          disabled={disabled}
          placeholder={t.calendar.pickTime}
          chipClassName={chipClassName}
        />
      )}

      {openPanel === 'date' && (
        <FloatingPanel anchorRef={dateBtnRef} onClose={() => setOpenPanel(null)} widthClass="w-72">
          <DatePanel selected={selected} onSelect={selectDate} />
        </FloatingPanel>
      )}
    </div>
  )
}
