import type { TaskCriticality } from '../api/types'
import { useLanguage } from '../i18n/LanguageContext'

const LEVELS: TaskCriticality[] = [1, 2, 3, 4, 5]

// Reuses the low/medium/high tri-color scheme, stretched across 5 steps —
// 3 lands on the same birch/yellow the old "medium" default used.
export const CRITICALITY_STYLES: Record<TaskCriticality, string> = {
  1: 'text-text-tertiary bg-black/[0.04]',
  2: 'text-moss bg-moss/15',
  3: 'text-birch bg-birch/15',
  4: 'text-clay bg-clay/15',
  5: 'text-clay bg-clay/25',
}

export default function CriticalityPicker({
  value,
  onChange,
}: {
  value: TaskCriticality
  onChange: (level: TaskCriticality) => void
}) {
  const { t } = useLanguage()

  return (
    <div className="flex gap-2">
      {LEVELS.map((level) => (
        <button
          key={level}
          type="button"
          onClick={() => onChange(level)}
          aria-label={`${t.taskModal.fieldCriticality} ${level}`}
          aria-pressed={value === level}
          className={[
            'flex size-9 items-center justify-center rounded-full text-[14px] font-semibold transition-transform active:scale-90',
            CRITICALITY_STYLES[level],
            value === level ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface-raised' : '',
          ].join(' ')}
        >
          {level}
        </button>
      ))}
    </div>
  )
}
