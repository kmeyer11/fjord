import { useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { CheckIcon } from './icons'
import Modal from './Modal'

// Mirrors the --color-fjord/glacier/moss/birch/clay/heather tokens in index.css.
// Stored as literal hex (rather than a var() reference) so the color travels
// intact outside the app shell — the .ics feed and any future clients.
const PALETTE = [
  { name: 'Fjord', value: '#3c6e90' },
  { name: 'Glacier', value: '#2f8f89' },
  { name: 'Moss', value: '#57784a' },
  { name: 'Birch', value: '#a97e2e' },
  { name: 'Clay', value: '#9c4a34' },
  { name: 'Heather', value: '#75587f' },
]

export default function NewProjectModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (data: { name: string; color: string }) => Promise<void>
}) {
  const { t } = useLanguage()
  const [name, setName] = useState('')
  const [color, setColor] = useState(PALETTE[0].value)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!name.trim() || submitting) return
    setSubmitting(true)
    try {
      await onCreate({ name: name.trim(), color })
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
            {t.newProjectModal.cancel}
          </button>
          <span className="text-[15px] font-semibold text-text">{t.newProjectModal.title}</span>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || submitting}
            className="text-[15px] font-semibold text-accent disabled:opacity-40"
          >
            {t.newProjectModal.create}
          </button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit()
        }}
        className="flex flex-col gap-5"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="project-name" className="text-[13px] font-medium text-text-secondary">
            {t.newProjectModal.name}
          </label>
          <input
            id="project-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.newProjectModal.namePlaceholder}
            className="rounded-xl border border-hairline bg-bg px-3 py-2.5 text-[15px] text-text outline-none placeholder:text-text-tertiary focus:border-accent"
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-text-secondary">{t.newProjectModal.color}</span>
          <div className="flex flex-wrap gap-3">
            {PALETTE.map((c) => (
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
      </form>
    </Modal>
  )
}
