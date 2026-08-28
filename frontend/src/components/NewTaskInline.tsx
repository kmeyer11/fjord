import { useState } from 'react'
import { PlusIcon } from './icons'

export default function NewTaskInline({ onCreate }: { onCreate: (title: string) => Promise<void> }) {
  const [active, setActive] = useState(false)
  const [title, setTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    const trimmed = title.trim()
    if (!trimmed) {
      setActive(false)
      return
    }
    setSubmitting(true)
    try {
      await onCreate(trimmed)
      setTitle('')
      setActive(false)
    } finally {
      setSubmitting(false)
    }
  }

  if (!active) {
    return (
      <button
        onClick={() => setActive(true)}
        className="flex items-center gap-1.5 rounded-xl p-2 text-left text-[13px] font-medium text-text-tertiary hover:bg-white/[0.04] hover:text-text-secondary"
      >
        <PlusIcon className="size-4" />
        Add task
      </button>
    )
  }

  return (
    <input
      autoFocus
      value={title}
      disabled={submitting}
      onChange={(e) => setTitle(e.target.value)}
      onBlur={submit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') submit()
        if (e.key === 'Escape') {
          setTitle('')
          setActive(false)
        }
      }}
      placeholder="Task title"
      className="rounded-xl border border-hairline bg-surface-raised px-3 py-2 text-[14px] text-text outline-none focus:border-accent"
    />
  )
}
