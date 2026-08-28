/**
 * Three separate channels converging into one — the app's namesake: distinct
 * project backlogs (the tributaries) meeting in a single navigable calendar
 * (the fjord mouth).
 */
export default function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" className={className}>
      <path d="M3 7C9 7 14 10.5 24 13.5" stroke="var(--color-fjord)" strokeWidth="2" strokeLinecap="round" />
      <path d="M3 14C10 14 16 13.7 24 13.5" stroke="var(--color-glacier)" strokeWidth="2" strokeLinecap="round" />
      <path d="M3 21C9 21 15 17 24 13.5" stroke="var(--color-heather)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
