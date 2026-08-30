import type { ExternalEvent } from '../api/types'
import { useLanguage } from '../i18n/LanguageContext'
import Modal from './Modal'

export default function ExternalEventDetailModal({
  event,
  onClose,
}: {
  event: ExternalEvent
  onClose: () => void
}) {
  const { t, locale } = useLanguage()

  const start = new Date(event.start)
  const end = new Date(event.end)
  const timeRange = event.all_day
    ? t.externalEventModal.allDay
    : `${start.toLocaleString(locale, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} – ${end.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })}`

  return (
    <Modal
      onClose={onClose}
      header={
        <>
          <span className="text-[15px] font-semibold text-text">{event.calendar}</span>
          <button onClick={onClose} className="text-[15px] text-accent">
            {t.externalEventModal.close}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-[17px] font-semibold text-text">{event.title}</h2>
          <span className="text-[13px] text-text-secondary">{timeRange}</span>
        </div>

        {event.location && (
          <div className="flex flex-col gap-1">
            <span className="text-[13px] font-medium text-text-secondary">{t.externalEventModal.location}</span>
            <p className="whitespace-pre-wrap text-[14px] text-text">{event.location}</p>
          </div>
        )}

        {event.description && (
          <div className="flex flex-col gap-1">
            <span className="text-[13px] font-medium text-text-secondary">{t.externalEventModal.description}</span>
            <p className="whitespace-pre-wrap text-[14px] text-text">{event.description}</p>
          </div>
        )}

        <span className="text-[12px] text-text-tertiary">{t.externalEventModal.readOnly}</span>
      </div>
    </Modal>
  )
}
