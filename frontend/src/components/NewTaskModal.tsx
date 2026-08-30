import { useState } from 'react'
import type { TaskCriticality } from '../api/types'
import { useLanguage } from '../i18n/LanguageContext'
import CriticalityPicker from './CriticalityPicker'
import Modal from './Modal'

export default function NewTaskModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (data: { title: string; description: string; criticality: TaskCriticality }) => Promise<void>
}) {
  const { t } = useLanguage()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [criticality, setCriticality] = useState<TaskCriticality>(3)
  const [submitting, setSubmitting] = useState(false)

  const canSave = title.trim() && !submitting

  async function handleSubmit() {
    if (!canSave) return
    setSubmitting(true)
    try {
      await onCreate({ title: title.trim(), description, criticality })
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
            {t.newTaskModal.cancel}
          </button>
          <span className="text-[15px] font-semibold text-text">{t.newTaskModal.title}</span>
          <button
            onClick={handleSubmit}
            disabled={!canSave}
            className="text-[15px] font-semibold text-accent disabled:opacity-40"
          >
            {t.newTaskModal.create}
          </button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit()
        }}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="new-task-title" className="text-[13px] font-medium text-text-secondary">
            {t.taskModal.fieldTitle}
          </label>
          <input
            id="new-task-title"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.board.taskTitlePlaceholder}
            className="rounded-xl border border-hairline bg-bg px-3 py-2.5 text-[15px] text-text outline-none placeholder:text-text-tertiary focus:border-accent"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="new-task-description" className="text-[13px] font-medium text-text-secondary">
            {t.taskModal.fieldDescription}
          </label>
          <textarea
            id="new-task-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder={t.taskModal.descriptionPlaceholder}
            className="resize-none rounded-xl border border-hairline bg-bg px-3 py-2.5 text-[14px] text-text outline-none placeholder:text-text-tertiary focus:border-accent"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-text-secondary">{t.taskModal.fieldCriticality}</span>
          <CriticalityPicker value={criticality} onChange={setCriticality} />
        </div>
      </form>
    </Modal>
  )
}
