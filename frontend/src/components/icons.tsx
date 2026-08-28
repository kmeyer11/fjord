type IconProps = { className?: string }

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function GridIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3.25" y="3.25" width="7.5" height="7.5" rx="2" />
      <rect x="13.25" y="3.25" width="7.5" height="7.5" rx="2" />
      <rect x="3.25" y="13.25" width="7.5" height="7.5" rx="2" />
      <rect x="13.25" y="13.25" width="7.5" height="7.5" rx="2" />
    </svg>
  )
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3.25" y="4.75" width="17.5" height="15.5" rx="3" />
      <path d="M3.25 9.5h17.5M8 3v3.5M16 3v3.5" />
    </svg>
  )
}

export function PlusIcon({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth={1.75} className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function ChevronLeftIcon({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth={1.75} className={className}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth={2} className={className}>
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  )
}
