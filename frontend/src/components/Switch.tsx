export default function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={[
        'relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors',
        checked ? 'bg-moss' : 'bg-hairline-strong',
      ].join(' ')}
    >
      <span
        className={[
          'absolute top-0.5 size-[22px] rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-[20px]' : 'translate-x-0.5',
        ].join(' ')}
      />
    </button>
  )
}
