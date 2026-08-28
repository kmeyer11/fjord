import { useState } from 'react'
import { CheckIcon } from './icons'
import Modal from './Modal'

// Mirrors the --color-fjord/glacier/moss/birch/clay/heather tokens in index.css.
// Stored as literal hex (rather than a var() reference) so the color travels
// intact outside the app shell — the .ics feed and any future clients.
const PALETTE = [
  { name: 'Fjord', value: '#4a7fa5' },
  { name: 'Glacier', value: '#3fa6a0' },
  { name: 'Moss', value: '#6b8f5c' },
  { name: 'Birch', value: '#c99a44' },
  { name: 'Clay', value: '#b25d45' },
  { name: 'Heather', value: '#8b6f9e' },
]

export default function NewProjectModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (data: { name: string; color: string }) => Promise<void>
}) {
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
            Cancel
          </button>
          <span className="text-[15px] font-semibold text-text">New Project</span>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || submitting}
            className="text-[15px] font-semibold text-accent disabled:opacity-40"
          >
            Create
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
            Name
          </label>
          <input
            id="project-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Homelab build"
            className="rounded-xl border border-hairline bg-bg px-3 py-2.5 text-[15px] text-text outline-none placeholder:text-text-tertiary focus:border-accent"
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-text-secondary">Color</span>
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
