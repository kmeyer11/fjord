import type { ReactNode } from 'react'

export default function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 md:items-center md:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-xl border border-border bg-surface-raised p-5 md:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-base font-semibold text-text">{title}</h2>
        {children}
      </div>
    </div>
  )
}
