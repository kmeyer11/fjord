import { useEffect, useState } from 'react'
import { ApiError, api } from '../api/client'
import Logo from '../components/Logo'
import { useLanguage } from '../i18n/LanguageContext'

const PIN_LENGTH = 4
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back']

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return minutes > 0 ? `${minutes}:${String(seconds).padStart(2, '0')}` : `${seconds}s`
}

export default function Login({
  pinSet,
  onSuccess,
}: {
  pinSet: boolean
  onSuccess: () => void
}) {
  const { t } = useLanguage()
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [lockedUntil, setLockedUntil] = useState<number | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(0)

  const locked = lockedUntil !== null && secondsLeft > 0

  useEffect(() => {
    if (lockedUntil === null) return
    const tick = () => setSecondsLeft(Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000)))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [lockedUntil])

  async function submit(value: string) {
    if (value.length !== PIN_LENGTH || submitting || locked) return
    setSubmitting(true)
    setError(false)
    try {
      await api.login(value)
      onSuccess()
    } catch (e) {
      if (e instanceof ApiError && e.status === 429) {
        setLockedUntil(Date.now() + (e.retryAfter ?? 30) * 1000)
      } else {
        setError(true)
      }
      setPin('')
    } finally {
      setSubmitting(false)
    }
  }

  function press(key: string) {
    if (submitting || locked || key === '') return
    if (key === 'back') {
      setPin((p) => p.slice(0, -1))
      return
    }
    if (pin.length >= PIN_LENGTH) return
    const next = pin + key
    setPin(next)
    if (next.length === PIN_LENGTH) void submit(next)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (/^[0-9]$/.test(e.key)) press(e.key)
      else if (e.key === 'Backspace') press('back')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, submitting, locked])

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 px-6">
      <div className="flex flex-col items-center gap-3">
        <Logo className="size-10" />
        <div className="text-center">
          <p className="text-[17px] font-semibold text-text">{pinSet ? t.login.enterPasscode : t.login.setPasscode}</p>
          <p className="mt-0.5 text-[13px] text-text-tertiary">{pinSet ? t.login.unlockHint : t.login.setHint}</p>
        </div>
      </div>

      <div className={['flex gap-3', error ? 'animate-[shake_0.4s]' : ''].join(' ')}>
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <span
            key={i}
            className={[
              'size-3 rounded-full border transition-colors',
              i < pin.length ? 'border-accent bg-accent' : 'border-hairline-strong bg-transparent',
              error ? 'border-clay bg-clay' : '',
            ].join(' ')}
          />
        ))}
      </div>

      {locked ? (
        <p className="-mt-4 text-[13px] text-clay">{t.login.tooManyAttempts(formatCountdown(secondsLeft))}</p>
      ) : (
        error && <p className="-mt-4 text-[13px] text-clay">{t.login.incorrect}</p>
      )}

      <div className="grid grid-cols-3 gap-4">
        {KEYS.map((key, i) => {
          if (key === '') return <div key={i} className="size-16" />
          return (
            <button
              key={i}
              onClick={() => press(key)}
              disabled={submitting || locked}
              className={[
                'flex size-16 items-center justify-center rounded-full text-[24px] font-medium transition-colors active:bg-black/[0.06] disabled:opacity-50',
                key === 'back' ? 'text-text-secondary' : 'bg-surface text-text border border-hairline',
              ].join(' ')}
            >
              {key === 'back' ? '⌫' : key}
            </button>
          )
        })}
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  )
}
