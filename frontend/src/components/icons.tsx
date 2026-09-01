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

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth={1.75} className={className}>
      <path d="M6 9l6 6 6-6" />
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

export function GearIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="3.25" />
      <path d="M12 3.5v2.4M12 18.1v2.4M20.5 12h-2.4M5.9 12H3.5M17.7 6.3l-1.7 1.7M8 16l-1.7 1.7M17.7 17.7L16 16M8 8L6.3 6.3" />
    </svg>
  )
}

export function PencilIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M14.5 4.5l5 5L8 21H3v-5L14.5 4.5Z" />
      <path d="M12.5 6.5l5 5" />
    </svg>
  )
}

export function RepeatIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4.5 12a7.5 7.5 0 0 1 12.6-5.5L19.5 8.5M19.5 8.5V4.5M19.5 8.5h-4" />
      <path d="M19.5 12a7.5 7.5 0 0 1-12.6 5.5L4.5 15.5M4.5 15.5v4M4.5 15.5h4" />
    </svg>
  )
}

export function StarIcon({ className, filled }: IconProps & { filled?: boolean }) {
  return (
    <svg {...base} fill={filled ? 'currentColor' : 'none'} className={className}>
      <path d="M12 3.5l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6-4.4-4.2 6-.8Z" strokeLinejoin="round" />
    </svg>
  )
}

export function GlobeIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8.75" />
      <path d="M3.25 12h17.5M12 3.25c2.6 2.4 4 5.4 4 8.75s-1.4 6.35-4 8.75c-2.6-2.4-4-5.4-4-8.75s1.4-6.35 4-8.75Z" />
    </svg>
  )
}
