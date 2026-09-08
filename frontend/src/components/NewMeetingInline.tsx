import { useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { toDatetimeLocalValue } from '../lib/date'
import DateTimePicker from './DateTimePicker'
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
  // Browsers (notably Safari) don't move focus to a checkbox/label on click,
  // so the blur that fires when you check a box reports relatedTarget as
  // null even though the click landed inside the container. Track pointer
  // activity directly, in the capture phase (before any blur fires), instead
  // of trusting relatedTarget.
  const pointerDownInsideRef = useRef(false)

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
      onPointerDownCapture={() => {
        pointerDownInsideRef.current = true
        // Self-clears next tick so a pointerdown that doesn't cause a blur
        // (e.g. clicking the already-focused element) can't leave a stale
        // flag that swallows a later, unrelated blur-to-submit.
        setTimeout(() => {
          pointerDownInsideRef.current = false
        }, 0)
      }}
      onBlur={(e) => {
        if (containerRef.current?.contains(e.relatedTarget as Node)) return
        if (pointerDownInsideRef.current) return
        submit()
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
      <DateTimePicker
        value={dueAt}
        onChange={setDueAt}
        allDay={allDay}
        disabled={submitting}
        ariaLabel={t.calendar.meetingDateTime}
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
      <div className="flex gap-1.5 pt-0.5">
        <button
          type="button"
          onClick={reset}
          disabled={submitting}
          className="flex-1 rounded-lg border border-hairline px-2 py-1.5 text-[12px] font-medium text-text-secondary hover:bg-black/[0.04] disabled:opacity-50"
        >
          {t.calendar.cancel}
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={submitting || !title.trim() || !dueAt}
          className="flex-1 rounded-lg bg-accent px-2 py-1.5 text-[12px] font-medium text-bg hover:bg-accent-strong disabled:opacity-40"
        >
          {t.calendar.create}
        </button>
      </div>
    </div>
  )
}
