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
        className="flex items-center gap-1.5 rounded-lg p-2 text-left text-sm text-text-muted hover:bg-surface-raised hover:text-text"
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
      className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text outline-none focus:border-text-muted"
    />
  )
}
