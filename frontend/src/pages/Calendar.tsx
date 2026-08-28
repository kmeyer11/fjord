export default function Calendar() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-8 text-center">
      <svg viewBox="0 0 240 120" className="w-56 opacity-80">
        <path d="M8 20C70 20 120 55 232 58" fill="none" stroke="var(--color-fjord)" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
        <path d="M8 45C70 45 130 56 232 58" fill="none" stroke="var(--color-glacier)" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
        <path d="M8 70C70 70 130 60 232 58" fill="none" stroke="var(--color-birch)" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
        <path d="M8 98C70 98 120 63 232 58" fill="none" stroke="var(--color-heather)" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
        <circle cx="232" cy="58" r="4" fill="var(--color-accent)" />
      </svg>
      <div className="max-w-xs">
        <p className="text-[15px] font-medium text-text">Every backlog flows here next</p>
        <p className="mt-1.5 text-[13px] text-text-tertiary">
          Week view, scheduling from the backlog, and Apple Calendar sync are next on the build order.
        </p>
      </div>
    </div>
  )
}
