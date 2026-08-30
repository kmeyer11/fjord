import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '../api/types'
import { useLanguage } from '../i18n/LanguageContext'
import { CRITICALITY_STYLES } from './CriticalityPicker'

export default function TaskCard({ task, onClick }: { task: Task; onClick?: () => void }) {
  const { t, locale } = useLanguage()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={[
        'touch-none rounded-xl border border-hairline bg-surface-raised p-3 text-[14px] shadow-sm',
        onClick ? 'cursor-pointer' : '',
        isDragging ? 'opacity-50' : 'cursor-grab active:cursor-grabbing',
      ].join(' ')}
    >
      <p className="text-text">{task.title}</p>
      {task.description && (
        <p className="mt-1 line-clamp-3 whitespace-pre-line text-[12.5px] text-text-secondary">
          {task.description}
        </p>
      )}
      <div className="mt-2 flex items-center gap-2">
        <span
          title={`${t.taskModal.fieldCriticality}: ${task.criticality}/5`}
          className={`flex size-5 items-center justify-center rounded-full text-[11px] font-semibold ${CRITICALITY_STYLES[task.criticality]}`}
        >
          {task.criticality}
        </span>
        {task.due_at && (
          <span className="text-[11px] text-text-tertiary">
            {new Date(task.due_at).toLocaleString(locale, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  )
}
