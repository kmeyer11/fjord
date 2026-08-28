import type { ReactNode } from 'react'

export default function Modal({
  header,
  onClose,
  children,
}: {
  header: ReactNode
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm md:items-center md:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-2xl border-t border-hairline bg-surface-raised pb-[env(safe-area-inset-bottom)] shadow-2xl md:rounded-2xl md:border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-2 md:hidden">
          <div className="h-1 w-9 rounded-full bg-hairline-strong" />
        </div>
        <div className="flex items-center justify-between border-b border-hairline px-4 py-3">{header}</div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}
