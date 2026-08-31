import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ExternalEvent, Task } from '../../api/types'
import { useLanguage } from '../../i18n/LanguageContext'
import { addMonths, formatMonth, isSameMonth } from '../../lib/date'
import { MonthGridBody, MonthWeekdayHeader } from './MonthGrid'

const MONTHS_BEFORE = 2
const MONTHS_AFTER = 4
const LOAD_MORE_CHUNK = 3

function monthKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}`
}

function buildInitialWindow(active: Date): Date[] {
  return Array.from({ length: MONTHS_BEFORE + 1 + MONTHS_AFTER }, (_, i) => addMonths(active, i - MONTHS_BEFORE))
}

/**
 * Continuous month-to-month scrolling. Rather than keeping a fixed-size
 * window and reshuffling it on every scroll tick (which reorders DOM nodes
 * mid-scroll and reads as flicker), months are only ever appended or
 * prepended as the user approaches an edge — plain growth, no reshuffling —
 * and "which month is active" is tracked separately with an
 * IntersectionObserver instead of hand-rolled scroll math, so it stays in
 * sync without fighting the browser's own scrolling.
 */
export default function MonthScroller({
  activeMonth,
  onActiveMonthChange,
  onRangeChange,
  tasksByDay,
  externalByDay,
  projectColors,
  onTaskClick,
  onExternalEventClick,
}: {
  activeMonth: Date
  onActiveMonthChange: (month: Date) => void
  onRangeChange: (start: Date, end: Date) => void
  tasksByDay: Map<string, Task[]>
  externalByDay: Map<string, ExternalEvent[]>
  projectColors: Map<number, string>
  onTaskClick?: (task: Task) => void
  onExternalEventClick?: (event: ExternalEvent) => void
}) {
  const { locale } = useLanguage()
  const containerRef = useRef<HTMLDivElement>(null)
  const topSentinelRef = useRef<HTMLDivElement>(null)
  const bottomSentinelRef = useRef<HTMLDivElement>(null)
  const sectionEls = useRef(new Map<string, HTMLDivElement>())
  const lastEmitted = useRef(activeMonth)
  const pendingScrollTarget = useRef<Date | null>(null)
  const pendingPrependCount = useRef(0)

  const [months, setMonths] = useState<Date[]>(() => buildInitialWindow(activeMonth))

  function scrollToMonth(month: Date) {
    const container = containerRef.current
    const el = sectionEls.current.get(monthKey(month))
    if (container && el) container.scrollTop = el.offsetTop
  }

  // Position on the active month once, on mount.
  useLayoutEffect(() => {
    scrollToMonth(activeMonth)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Report the rendered range so the parent knows what data to fetch.
  useEffect(() => {
    onRangeChange(months[0], addMonths(months[months.length - 1], 1))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [months])

  // External navigation (the header's prev/next buttons) — jump to the
  // target month, extending the loaded range first if it isn't there yet.
  // Skipped for the echo of our own IntersectionObserver-driven update.
  useEffect(() => {
    if (isSameMonth(activeMonth, lastEmitted.current)) return
    lastEmitted.current = activeMonth
    if (months.some((m) => isSameMonth(m, activeMonth))) {
      scrollToMonth(activeMonth)
    } else {
      pendingScrollTarget.current = activeMonth
      setMonths(buildInitialWindow(activeMonth))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMonth])

  // Scroll correction after the months array changes: either land on a
  // pending nav target, or compensate for months just prepended above the
  // fold (appending below never needs correction — nothing above moves).
  useLayoutEffect(() => {
    if (pendingScrollTarget.current) {
      scrollToMonth(pendingScrollTarget.current)
      pendingScrollTarget.current = null
      return
    }
    if (pendingPrependCount.current > 0) {
      const container = containerRef.current
      let addedHeight = 0
      for (let i = 0; i < pendingPrependCount.current; i++) {
        addedHeight += sectionEls.current.get(monthKey(months[i]))?.offsetHeight ?? 0
      }
      if (container) container.scrollTop += addedHeight
      pendingPrependCount.current = 0
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [months])

  // Track which month is at the top of the viewport, independent of the
  // load-more logic — a thin band at the very top of the scroll container,
  // so whichever month's section currently spans it is "active".
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const month = (entry.target as HTMLElement).dataset.month
          if (!month) continue
          const [y, m] = month.split('-').map(Number)
          const date = new Date(y, m, 1)
          if (isSameMonth(date, lastEmitted.current)) continue
          lastEmitted.current = date
          onActiveMonthChange(date)
        }
      },
      { root: container, rootMargin: '0px 0px -99% 0px', threshold: 0 },
    )
    for (const el of sectionEls.current.values()) observer.observe(el)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [months])

  // Grow the range as the user nears either edge.
  useEffect(() => {
    const container = containerRef.current
    const top = topSentinelRef.current
    const bottom = bottomSentinelRef.current
    if (!container || !top || !bottom) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          if (entry.target === top) {
            pendingPrependCount.current = LOAD_MORE_CHUNK
            setMonths((prev) => [
              ...Array.from({ length: LOAD_MORE_CHUNK }, (_, i) => addMonths(prev[0], i - LOAD_MORE_CHUNK)),
              ...prev,
            ])
          } else if (entry.target === bottom) {
            setMonths((prev) => [
              ...prev,
              ...Array.from({ length: LOAD_MORE_CHUNK }, (_, i) => addMonths(prev[prev.length - 1], i + 1)),
            ])
          }
        }
      },
      { root: container, rootMargin: '600px 0px 600px 0px' },
    )
    observer.observe(top)
    observer.observe(bottom)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <MonthWeekdayHeader />
      <div ref={containerRef} style={{ overflowAnchor: 'none' }} className="relative min-h-0 flex-1 overflow-y-auto">
        <div ref={topSentinelRef} />
        {months.map((month) => (
          <div
            key={monthKey(month)}
            data-month={monthKey(month)}
            ref={(el) => {
              if (el) sectionEls.current.set(monthKey(month), el)
              else sectionEls.current.delete(monthKey(month))
            }}
          >
            <p className="border-b border-hairline px-2 py-1 text-center text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
              {formatMonth(month, locale)}
            </p>
            <MonthGridBody
              monthDate={month}
              tasksByDay={tasksByDay}
              externalByDay={externalByDay}
              projectColors={projectColors}
              onTaskClick={onTaskClick}
              onExternalEventClick={onExternalEventClick}
            />
          </div>
        ))}
        <div ref={bottomSentinelRef} />
      </div>
    </div>
  )
}
