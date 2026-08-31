/** Monday-start week containing `date`. */
export function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = (d.getDay() + 6) % 7 // 0 = Monday
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/** Local calendar date as YYYY-MM-DD, independent of timezone-shifting toISOString(). */
export function dateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatWeekRange(start: Date, locale: string): string {
  const end = addDays(start, 6)
  const sameMonth = start.getMonth() === end.getMonth()
  const startFmt = start.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
  const endFmt = end.toLocaleDateString(locale, sameMonth ? { day: 'numeric' } : { month: 'short', day: 'numeric' })
  return `${startFmt} – ${endFmt}`
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

/** Month-start `months` away from `date` (which should itself be a month-start). */
export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

/**
 * Cells for one month's Monday-start grid — `null` for the leading/trailing
 * blanks that round the month out to full weeks, real dates for the days of
 * that month only. Unlike padding with the adjacent month's actual dates,
 * this is what MonthScroller needs: stacking several months back to back
 * with real adjacent-month dates would show the same date twice, once as
 * trailing padding in one month and again as the real day in the next.
 */
export function getMonthCells(monthDate: Date): (Date | null)[] {
  const first = startOfMonth(monthDate)
  const leadingBlanks = (first.getDay() + 6) % 7 // Monday-start offset
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate()

  const cells: (Date | null)[] = new Array(leadingBlanks).fill(null)
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), day))

  const trailingBlanks = (7 - (cells.length % 7)) % 7
  cells.push(...new Array(trailingBlanks).fill(null))
  return cells
}

export function formatMonth(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
}

/** Local wall-clock value for <input type="datetime-local">, independent of
 * timezone-shifting toISOString(). */
export function toDatetimeLocalValue(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${dateKey(date)}T${hh}:${mm}`
}
