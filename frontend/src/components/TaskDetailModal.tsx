import { useState } from 'react'
import type { Task, TaskCriticality } from '../api/types'
import { useLanguage } from '../i18n/LanguageContext'
import { dateKey, formatDueDate, toDatetimeLocalValue } from '../lib/date'
import CriticalityPicker from './CriticalityPicker'
import DateTimePicker from './DateTimePicker'
import { RepeatIcon } from './icons'
import Modal from './Modal'

export default function TaskDetailModal({
  task,
  onClose,
  onSave,
  onDelete,
}: {
  task: Task
  onClose: () => void
  onSave: (data: {
    title: string
    description: string
    criticality: TaskCriticality
    due_at?: string
    all_day?: boolean
    recurring?: boolean
  }) => Promise<void>
  onDelete: (scope: 'single' | 'future') => Promise<void>
}) {
  const { t, locale } = useLanguage()
  const isMeeting = task.category === 'meeting'
  // Whether the saved task is (still) part of a series — drives the delete
  // buttons below, which act on stored state, not the pending edit.
  const wasRecurring = task.recurrence_id != null
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description)
  const [criticality, setCriticality] = useState<TaskCriticality>(task.criticality)
  const [allDay, setAllDay] = useState(task.all_day)
  const [dueAt, setDueAt] = useState(
    task.due_at ? (task.all_day ? dateKey(new Date(task.due_at)) : toDatetimeLocalValue(new Date(task.due_at))) : '',
  )
  const [recurring, setRecurring] = useState(wasRecurring)
  const [submitting, setSubmitting] = useState(false)

  const canSave = title.trim() && (!isMeeting || dueAt) && !submitting

  function toggleAllDay(checked: boolean) {
    setAllDay(checked)
    setDueAt((prev) => (checked ? prev.slice(0, 10) : prev.length === 10 ? `${prev}T09:00` : prev))
  }

  async function handleSave() {
    if (!canSave) return
    setSubmitting(true)
    try {
      const due = isMeeting ? new Date(allDay ? `${dueAt}T00:00` : dueAt) : undefined
      await onSave({
        title: title.trim(),
        description,
        criticality,
        due_at: due?.toISOString(),
        all_day: isMeeting ? allDay : undefined,
        recurring: isMeeting ? recurring : undefined,
      })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(scope: 'single' | 'future') {
    if (submitting) return
    setSubmitting(true)
    try {
      await onDelete(scope)
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
            {t.taskModal.cancel}
          </button>
          <span className="text-[15px] font-semibold text-text">
            {isMeeting ? t.taskModal.titleMeeting : t.taskModal.title}
          </span>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="text-[15px] font-semibold text-accent disabled:opacity-40"
          >
            {t.taskModal.save}
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
          <label htmlFor="task-title" className="text-[13px] font-medium text-text-secondary">
            {t.taskModal.fieldTitle}
          </label>
          <input
            id="task-title"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-xl border border-hairline bg-bg px-3 py-2.5 text-[15px] text-text outline-none focus:border-accent"
          />
        </div>

        {!isMeeting && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="task-description" className="text-[13px] font-medium text-text-secondary">
              {t.taskModal.fieldDescription}
            </label>
            <textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder={t.taskModal.descriptionPlaceholder}
              className="resize-none rounded-xl border border-hairline bg-bg px-3 py-2.5 text-[14px] text-text outline-none placeholder:text-text-tertiary focus:border-accent"
            />
          </div>
        )}

        {!isMeeting && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-text-secondary">{t.taskModal.fieldCriticality}</span>
            <CriticalityPicker value={criticality} onChange={setCriticality} />
          </div>
        )}

        {!isMeeting && task.due_at && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-text-secondary">{t.taskModal.fieldDueDate}</span>
            <p className="text-[15px] text-text">{formatDueDate(new Date(task.due_at), locale)}</p>
          </div>
        )}

        {isMeeting && (
          <div className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5 text-[13px] font-medium text-text-secondary">
              {t.calendar.meetingDateTime}
              {recurring && <RepeatIcon className="size-3.5 text-text-tertiary" />}
            </span>
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
        )}

        {wasRecurring ? (
          <div className="mt-1 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => handleDelete('single')}
              disabled={submitting}
              className="rounded-xl border border-hairline bg-surface px-4 py-2.5 text-center text-[14px] font-medium text-clay disabled:opacity-40"
            >
              {t.taskModal.deleteOccurrence}
            </button>
            <button
              type="button"
              onClick={() => handleDelete('future')}
              disabled={submitting}
              className="rounded-xl border border-hairline bg-surface px-4 py-2.5 text-center text-[14px] font-medium text-clay disabled:opacity-40"
            >
              {t.taskModal.deleteFuture}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => handleDelete('single')}
            disabled={submitting}
            className="mt-1 rounded-xl border border-hairline bg-surface px-4 py-2.5 text-center text-[14px] font-medium text-clay disabled:opacity-40"
          >
            {isMeeting ? t.taskModal.deleteMeeting : t.taskModal.delete}
          </button>
        )}
      </form>
    </Modal>
  )
}
