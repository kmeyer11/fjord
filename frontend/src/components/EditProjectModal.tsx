import { useState } from 'react'
import type { ProjectWithCounts } from '../api/types'
import { useLanguage } from '../i18n/LanguageContext'
import { PROJECT_PALETTE } from '../lib/projectColors'
import { CheckIcon } from './icons'
import Modal from './Modal'

export default function EditProjectModal({
  project,
  onClose,
  onSave,
  onDelete,
}: {
  project: ProjectWithCounts
  onClose: () => void
  onSave: (data: { name: string; color: string }) => Promise<void>
  onDelete: () => Promise<void>
}) {
  const { t } = useLanguage()
  const [name, setName] = useState(project.name)
  const [color, setColor] = useState(project.color)
  const [submitting, setSubmitting] = useState(false)

  const canSave = name.trim() && !submitting

  async function handleSave() {
    if (!canSave) return
    setSubmitting(true)
    try {
      await onSave({ name: name.trim(), color })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (submitting) return
    if (!window.confirm(t.editProjectModal.deleteConfirm(project.name))) return
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
            {t.editProjectModal.cancel}
          </button>
          <span className="text-[15px] font-semibold text-text">{t.editProjectModal.title}</span>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="text-[15px] font-semibold text-accent disabled:opacity-40"
          >
            {t.editProjectModal.save}
          </button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSave()
        }}
        className="flex flex-col gap-5"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="edit-project-name" className="text-[13px] font-medium text-text-secondary">
            {t.newProjectModal.name}
          </label>
          <input
            id="edit-project-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl border border-hairline bg-bg px-3 py-2.5 text-[15px] text-text outline-none focus:border-accent"
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-text-secondary">{t.newProjectModal.color}</span>
          <div className="flex flex-wrap gap-3">
            {PROJECT_PALETTE.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => setColor(c.value)}
                aria-label={c.name}
                className="flex size-8 items-center justify-center rounded-full transition-transform active:scale-90"
                style={{ backgroundColor: c.value }}
              >
                {color === c.value && <CheckIcon className="size-4 text-bg" />}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleDelete}
          disabled={submitting}
          className="mt-1 rounded-xl border border-hairline bg-surface px-4 py-2.5 text-center text-[14px] font-medium text-clay disabled:opacity-40"
        >
          {t.editProjectModal.delete}
        </button>
      </form>
    </Modal>
  )
}
