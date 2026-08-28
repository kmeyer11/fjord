import { useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { PlusIcon } from './icons'

export default function NewTaskInline({ onCreate }: { onCreate: (title: string) => Promise<void> }) {
  const { t } = useLanguage()
  const [active, setActive] = useState(false)
  const [title, setTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  // Removing the input on success fires a native blur, re-invoking onBlur's
  // submit with the same stale title — this ref (shared across renders,
  // unlike state) blocks that second call regardless of which render's
  // closure ends up handling it.
  const handledRef = useRef(false)

  function startNew() {
    handledRef.current = false
    setActive(true)
  }

  async function submit() {
    if (handledRef.current) return
    const trimmed = title.trim()
    if (!trimmed) {
      handledRef.current = true
      setActive(false)
      return
    }
    handledRef.current = true
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
        onClick={startNew}
        className="flex items-center gap-1.5 rounded-xl p-2 text-left text-[13px] font-medium text-text-tertiary hover:bg-black/[0.04] hover:text-text-secondary"
      >
        <PlusIcon className="size-4" />
        {t.board.addTask}
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
          handledRef.current = true
          setTitle('')
          setActive(false)
        }
      }}
      placeholder={t.board.taskTitlePlaceholder}
      className="rounded-xl border border-hairline bg-surface-raised px-3 py-2 text-[14px] text-text outline-none focus:border-accent"
    />
  )
}
