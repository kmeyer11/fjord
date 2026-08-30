import { useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { toDatetimeLocalValue } from '../lib/date'
import { PlusIcon, RepeatIcon } from './icons'

export default function NewMeetingInline({
  onCreate,
}: {
  onCreate: (data: { title: string; due_at: string; all_day?: boolean; recurring?: boolean }) => Promise<void>
}) {
  const { t } = useLanguage()
  const [active, setActive] = useState(false)
  const [title, setTitle] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [allDay, setAllDay] = useState(false)
  const [recurring, setRecurring] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  // Removing the form on success fires a native blur, re-invoking the
  // container's onBlur submit handler with the same stale values.
  const handledRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  function reset() {
    handledRef.current = true
    setTitle('')
    setDueAt('')
    setAllDay(false)
    setRecurring(false)
    setActive(false)
  }

  function startNew() {
    handledRef.current = false
    setDueAt(toDatetimeLocalValue(new Date()))
    setAllDay(false)
    setActive(true)
  }

  function toggleAllDay(checked: boolean) {
    setAllDay(checked)
    // Switching input type between date and datetime-local needs its value
    // reshaped to match, or the browser just clears it.
    setDueAt((prev) => (checked ? prev.slice(0, 10) : prev.length === 10 ? `${prev}T09:00` : prev))
  }

  async function submit() {
    if (handledRef.current) return
    const trimmed = title.trim()
    if (!trimmed || !dueAt) {
      reset()
      return
    }
    handledRef.current = true
    setSubmitting(true)
    try {
      const due = new Date(allDay ? `${dueAt}T00:00` : dueAt)
      await onCreate({ title: trimmed, due_at: due.toISOString(), all_day: allDay, recurring })
      setTitle('')
      setDueAt('')
      setAllDay(false)
      setRecurring(false)
      setActive(false)
    } finally {
      setSubmitting(false)
    }
  }

  if (!active) {
    return (
      <button
        onClick={startNew}
        className="flex items-center gap-1.5 rounded-xl p-2 text-left text-[13px] font-medium text-text-tertiary hover:bg-black/[0.04] hover:text-text-secondary"
      >
        <PlusIcon className="size-4" />
        {t.calendar.newMeeting}
      </button>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-1.5 rounded-xl border border-hairline bg-surface-raised p-2"
      onBlur={(e) => {
        if (!containerRef.current?.contains(e.relatedTarget as Node)) submit()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') submit()
        if (e.key === 'Escape') reset()
      }}
    >
      <input
        autoFocus
        value={title}
        disabled={submitting}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t.calendar.meetingTitlePlaceholder}
        className="rounded-lg border border-hairline bg-surface px-2 py-1.5 text-[14px] text-text outline-none focus:border-accent"
      />
      <input
        type={allDay ? 'date' : 'datetime-local'}
        value={dueAt}
        disabled={submitting}
        onChange={(e) => setDueAt(e.target.value)}
        aria-label={t.calendar.meetingDateTime}
        className="rounded-lg border border-hairline bg-surface px-2 py-1.5 text-[13px] text-text outline-none focus:border-accent"
      />
      <label className="flex items-center gap-1.5 px-0.5 py-0.5 text-[12px] text-text-secondary">
        <input
          type="checkbox"
          checked={allDay}
          disabled={submitting}
          onChange={(e) => toggleAllDay(e.target.checked)}
          className="size-3.5 accent-accent"
        />
        {t.calendar.allDay}
      </label>
      <label className="flex items-center gap-1.5 px-0.5 py-0.5 text-[12px] text-text-secondary">
        <input
          type="checkbox"
          checked={recurring}
          disabled={submitting}
          onChange={(e) => setRecurring(e.target.checked)}
          className="size-3.5 accent-accent"
        />
        <RepeatIcon className="size-3 shrink-0" />
        {t.calendar.repeatWeekly}
      </label>
    </div>
  )
}
