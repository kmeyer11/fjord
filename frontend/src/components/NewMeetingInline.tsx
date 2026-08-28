import { useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { toDatetimeLocalValue } from '../lib/date'
import { PlusIcon } from './icons'

export default function NewMeetingInline({
  onCreate,
}: {
  onCreate: (data: { title: string; due_at: string }) => Promise<void>
}) {
  const { t } = useLanguage()
  const [active, setActive] = useState(false)
  const [title, setTitle] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [submitting, setSubmitting] = useState(false)
  // Same double-submit guard as NewTaskInline: removing the form on success
  // fires a native blur, re-invoking the container's onBlur submit handler.
  const handledRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  function reset() {
    handledRef.current = true
    setTitle('')
    setDueAt('')
    setActive(false)
  }

  function startNew() {
    handledRef.current = false
    setDueAt(toDatetimeLocalValue(new Date()))
    setActive(true)
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
      await onCreate({ title: trimmed, due_at: new Date(dueAt).toISOString() })
      setTitle('')
      setDueAt('')
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
        type="datetime-local"
        value={dueAt}
        disabled={submitting}
        onChange={(e) => setDueAt(e.target.value)}
        aria-label={t.calendar.meetingDateTime}
        className="rounded-lg border border-hairline bg-surface px-2 py-1.5 text-[13px] text-text outline-none focus:border-accent"
      />
    </div>
  )
}
