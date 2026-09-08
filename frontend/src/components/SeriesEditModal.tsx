import { useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { TimePicker } from './DateTimePicker'
import { RepeatIcon } from './icons'
import Modal from './Modal'

export interface SeriesEditData {
  recurrenceId: string
  title: string
  /** 0=Monday..6=Sunday, matching t.weekdaysShort and the backend's convention. */
  weekday: number
  hour: number
  minute: number
  allDay: boolean
}

/**
 * Reschedules an entire recurring series at once (weekday, time, title)
 * instead of only being able to delete-and-recreate occurrences — opened
 * from the sidebar's "Gentagende" row, distinct from TaskDetailModal which
 * still edits (or deletes) a single occurrence clicked on the calendar grid.
 */
export default function SeriesEditModal({
  series,
  onClose,
  onSave,
  onDelete,
}: {
  series: SeriesEditData
  onClose: () => void
  onSave: (data: { title: string; weekday: number; time: string; all_day?: boolean }) => Promise<void>
  onDelete: () => Promise<void>
}) {
  const { t } = useLanguage()
  const [title, setTitle] = useState(series.title)
  const [weekday, setWeekday] = useState(series.weekday)
  const [hour, setHour] = useState(series.hour)
  const [minute, setMinute] = useState(series.minute)
  const [allDay, setAllDay] = useState(series.allDay)
  const [timeOpen, setTimeOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const canSave = title.trim() && !submitting

  async function handleSave() {
    if (!canSave) return
    setSubmitting(true)
    try {
      const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
      await onSave({ title: title.trim(), weekday, time, all_day: allDay })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (submitting) return
    setSubmitting(true)
    try {
      await onDelete()
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
          <span className="text-[15px] font-semibold text-text">{t.calendar.editSeries}</span>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="text-[15px] font-semibold text-accent disabled:opacity-40"
          >
            {t.calendar.save}
          </button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSave()
        }}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="series-title" className="text-[13px] font-medium text-text-secondary">
            {t.taskModal.fieldTitle}
          </label>
          <input
            id="series-title"
            autoFocus
            value={title}
            disabled={submitting}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-xl border border-hairline bg-bg px-3 py-2.5 text-[15px] text-text outline-none focus:border-accent"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-[13px] font-medium text-text-secondary">
            <RepeatIcon className="size-3.5 text-text-tertiary" />
            {t.calendar.seriesWeekday}
          </span>
          <div className="flex gap-1">
            {t.weekdaysShort.map((label, i) => (
              <button
                key={label}
                type="button"
                disabled={submitting}
                aria-pressed={weekday === i}
                onClick={() => setWeekday(i)}
                className={[
                  'flex-1 rounded-lg py-2 text-[12px] font-semibold transition-colors disabled:opacity-50',
                  weekday === i ? 'bg-accent text-bg' : 'bg-bg text-text-secondary hover:bg-black/[0.04]',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>
          {!allDay && (
            <div className="pt-0.5">
              <TimePicker
                value={{ hour, minute }}
                onChange={(h, m) => {
                  setHour(h)
                  setMinute(m)
                }}
                open={timeOpen}
                onOpenChange={setTimeOpen}
                disabled={submitting}
                ariaLabel={t.calendar.meetingDateTime}
                placeholder={t.calendar.pickTime}
                chipClassName="bg-bg"
              />
            </div>
          )}
          <label className="flex items-center gap-1.5 px-0.5 py-0.5 text-[12px] text-text-secondary">
            <input
              type="checkbox"
              checked={allDay}
              disabled={submitting}
              onChange={(e) => setAllDay(e.target.checked)}
              className="size-3.5 accent-accent"
            />
            {t.calendar.allDay}
          </label>
        </div>

        <button
          type="button"
          onClick={handleDelete}
          disabled={submitting}
          className="mt-1 rounded-xl border border-hairline bg-surface px-4 py-2.5 text-center text-[14px] font-medium text-clay disabled:opacity-40"
        >
          {t.calendar.deleteSeries}
        </button>
      </form>
    </Modal>
  )
}
