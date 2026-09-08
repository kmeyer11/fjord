import { useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { toDatetimeLocalValue } from '../lib/date'
import DateTimePicker from './DateTimePicker'
import { RepeatIcon } from './icons'
import Modal from './Modal'

/**
 * Same fields as the sidebar's inline "new meeting" form, as a modal —
 * opened by double-clicking a day/slot on the calendar grid, which is too
 * cramped there for an inline form the way the sidebar has room for one.
 */
export default function NewMeetingModal({
  initialDate,
  onClose,
  onCreate,
}: {
  initialDate: Date
  onClose: () => void
  onCreate: (data: { title: string; due_at: string; all_day?: boolean; recurring?: boolean }) => Promise<void>
}) {
  const { t } = useLanguage()
  const [title, setTitle] = useState('')
  const [dueAt, setDueAt] = useState(() => toDatetimeLocalValue(initialDate))
  const [allDay, setAllDay] = useState(false)
  const [recurring, setRecurring] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const canCreate = title.trim() && dueAt && !submitting

  function toggleAllDay(checked: boolean) {
    setAllDay(checked)
    setDueAt((prev) => (checked ? prev.slice(0, 10) : prev.length === 10 ? `${prev}T09:00` : prev))
  }

  async function handleCreate() {
    if (!canCreate) return
    setSubmitting(true)
    try {
      const due = new Date(allDay ? `${dueAt}T00:00` : dueAt)
      await onCreate({ title: title.trim(), due_at: due.toISOString(), all_day: allDay, recurring })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      onClose={onClose}
      header={
        <>
          <button onClick={onClose} className="text-[15px] text-accent">
            {t.calendar.cancel}
          </button>
          <span className="text-[15px] font-semibold text-text">{t.calendar.newMeeting}</span>
          <button
            onClick={handleCreate}
            disabled={!canCreate}
            className="text-[15px] font-semibold text-accent disabled:opacity-40"
          >
            {t.calendar.create}
          </button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleCreate()
        }}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="new-meeting-title" className="text-[13px] font-medium text-text-secondary">
            {t.taskModal.fieldTitle}
          </label>
          <input
            id="new-meeting-title"
            autoFocus
            value={title}
            disabled={submitting}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.calendar.meetingTitlePlaceholder}
            className="rounded-xl border border-hairline bg-bg px-3 py-2.5 text-[15px] text-text outline-none focus:border-accent"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-text-secondary">{t.calendar.meetingDateTime}</span>
          <DateTimePicker
            value={dueAt}
            onChange={setDueAt}
            allDay={allDay}
            disabled={submitting}
            ariaLabel={t.calendar.meetingDateTime}
            chipClassName="bg-bg"
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
      </form>
    </Modal>
  )
}
