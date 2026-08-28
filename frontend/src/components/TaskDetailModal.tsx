import { useState } from 'react'
import type { Task } from '../api/types'
import { useLanguage } from '../i18n/LanguageContext'
import Modal from './Modal'

export default function TaskDetailModal({
  task,
  onClose,
  onSave,
  onDelete,
}: {
  task: Task
  onClose: () => void
  onSave: (data: { title: string; description: string }) => Promise<void>
  onDelete: () => Promise<void>
}) {
  const { t } = useLanguage()
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description)
  const [submitting, setSubmitting] = useState(false)

  async function handleSave() {
    if (!title.trim() || submitting) return
    setSubmitting(true)
    try {
      await onSave({ title: title.trim(), description })
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
            {t.taskModal.cancel}
          </button>
          <span className="text-[15px] font-semibold text-text">{t.taskModal.title}</span>
          <button
            onClick={handleSave}
            disabled={!title.trim() || submitting}
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

        <button
          type="button"
          onClick={handleDelete}
          disabled={submitting}
          className="mt-1 rounded-xl border border-hairline bg-surface px-4 py-2.5 text-center text-[14px] font-medium text-clay disabled:opacity-40"
        >
          {t.taskModal.delete}
        </button>
      </form>
    </Modal>
  )
}
