import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import { useLanguage } from '../i18n/LanguageContext'

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="px-1 text-[13px] font-semibold uppercase tracking-wide text-text-tertiary">{title}</h2>
      <div className="rounded-2xl border border-hairline bg-surface p-4">{children}</div>
    </section>
  )
}

function StatusDot({ ok }: { ok: boolean }) {
  return <span className={`size-2 rounded-full ${ok ? 'bg-moss' : 'bg-text-tertiary'}`} />
}

type CalendarStatus = {
  configured: boolean
  icloud_username: string | null
  last_synced_at: string | null
  last_error: string | null
}

export default function Settings() {
  const { t, locale } = useLanguage()
  const [feedUrl, setFeedUrl] = useState<string | null>(null)
  const [calStatus, setCalStatus] = useState<CalendarStatus | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [copied, setCopied] = useState(false)
  const feedUrlInputRef = useRef<HTMLInputElement>(null)

  const [connecting, setConnecting] = useState(false)
  const [icloudEmail, setIcloudEmail] = useState('')
  const [icloudPassword, setIcloudPassword] = useState('')
  const [connectError, setConnectError] = useState<string | null>(null)
  const [connectSubmitting, setConnectSubmitting] = useState(false)

  const [changingPin, setChangingPin] = useState(false)
  const [newPin, setNewPin] = useState('')
  const [pinSaved, setPinSaved] = useState(false)

  function loadFeedUrl() {
    api.getFeedToken().then(({ token }) => setFeedUrl(`${window.location.origin}/calendar/fjord.ics?token=${token}`))
  }

  function loadCalStatus() {
    api.getCalendarStatus().then(setCalStatus)
  }

  useEffect(() => {
    loadFeedUrl()
    loadCalStatus()
  }, [])

  async function refreshCalendar() {
    setRefreshing(true)
    try {
      const now = new Date()
      const start = new Date(now.getTime() - 7 * 86400_000)
      const end = new Date(now.getTime() + 21 * 86400_000)
      await api.listExternalEvents(start, end, true)
      loadCalStatus()
    } finally {
      setRefreshing(false)
    }
  }

  async function copyFeedUrl() {
    if (!feedUrl) return
    try {
      // navigator.clipboard needs a secure context (https, or the browser's own
      // localhost) — this app is meant to be opened over plain http from a phone
      // on the LAN (see FJORD_HOST default), which is *not* secure, so this API
      // is routinely unavailable there and throws/rejects.
      await navigator.clipboard.writeText(feedUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Fall back to the legacy selection-based copy, which works without the
      // Clipboard API's secure-context requirement.
      const input = feedUrlInputRef.current
      if (input) {
        input.focus()
        input.select()
        try {
          if (document.execCommand('copy')) {
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          }
        } catch {
          // Both copy paths failed — the input is still focused and selected
          // so the user can copy it manually.
        }
      }
    }
  }

  async function connectICloud() {
    if (!icloudEmail || !icloudPassword) return
    setConnectSubmitting(true)
    setConnectError(null)
    try {
      await api.connectICloud(icloudEmail, icloudPassword)
      setIcloudEmail('')
      setIcloudPassword('')
      setConnecting(false)
      loadCalStatus()
    } catch (e) {
      setConnectError(e instanceof Error ? e.message : String(e))
    } finally {
      setConnectSubmitting(false)
    }
  }

  async function disconnectICloud() {
    await api.disconnectICloud()
    loadCalStatus()
  }

  async function savePin() {
    if (newPin.length < 4) return
    await api.changePin(newPin)
    setNewPin('')
    setChangingPin(false)
    setPinSaved(true)
    setTimeout(() => setPinSaved(false), 1500)
  }

  async function logout() {
    await api.logout()
    window.location.reload()
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-6 md:px-8 md:pt-10">
      <h1 className="mb-7 text-[28px] font-bold tracking-tight text-text md:text-[32px]">{t.settings.title}</h1>

      <div className="flex flex-col gap-6">
        <SettingsSection title={t.settings.appleCalendar}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusDot ok={!!calStatus?.configured} />
              <span className="text-[14px] text-text">
                {calStatus?.configured ? t.settings.connected(calStatus.icloud_username ?? '') : t.settings.notConnected}
              </span>
            </div>
            {calStatus?.configured && (
              <button
                onClick={refreshCalendar}
                disabled={refreshing}
                className="rounded-full border border-hairline px-3 py-1 text-[13px] font-medium text-text-secondary disabled:opacity-40"
              >
                {refreshing ? t.settings.refreshing : t.settings.refreshNow}
              </button>
            )}
          </div>

          {calStatus?.configured ? (
            <>
              <p className="mt-2 text-[12px] text-text-tertiary">
                {calStatus.last_error
                  ? t.settings.lastSyncFailed(calStatus.last_error)
                  : calStatus.last_synced_at
                    ? t.settings.lastSynced(new Date(calStatus.last_synced_at).toLocaleString(locale))
                    : t.settings.notSyncedYet}
              </p>
              <button onClick={disconnectICloud} className="mt-3 text-[13px] font-medium text-clay">
                {t.settings.disconnect}
              </button>
            </>
          ) : connecting ? (
            <div className="mt-3 flex flex-col gap-2">
              <input
                type="email"
                autoFocus
                value={icloudEmail}
                onChange={(e) => setIcloudEmail(e.target.value)}
                placeholder={t.settings.emailPlaceholder}
                className="rounded-lg border border-hairline bg-bg px-3 py-2 text-[14px] text-text outline-none focus:border-accent"
              />
              <input
                type="password"
                value={icloudPassword}
                onChange={(e) => setIcloudPassword(e.target.value)}
                placeholder={t.settings.passwordPlaceholder}
                className="rounded-lg border border-hairline bg-bg px-3 py-2 text-[14px] text-text outline-none focus:border-accent"
              />
              {connectError && <p className="text-[12px] text-clay">{connectError}</p>}
              <div className="flex items-center gap-3">
                <button
                  onClick={connectICloud}
                  disabled={!icloudEmail || !icloudPassword || connectSubmitting}
                  className="rounded-full bg-accent px-3 py-1.5 text-[13px] font-semibold text-bg disabled:opacity-40"
                >
                  {connectSubmitting ? t.settings.connecting : t.settings.connect}
                </button>
                <button onClick={() => setConnecting(false)} className="text-[13px] text-text-tertiary">
                  {t.settings.cancel}
                </button>
              </div>
              <p className="text-[12px] text-text-tertiary">
                {(() => {
                  const [before, after] = t.settings.appSpecificHint('appleid.apple.com').split('appleid.apple.com')
                  return (
                    <>
                      {before}
                      <a href="https://appleid.apple.com" target="_blank" rel="noreferrer" className="text-accent">
                        appleid.apple.com
                      </a>
                      {after}
                    </>
                  )
                })()}
              </p>
            </div>
          ) : (
            <div className="mt-2 flex items-center justify-between">
              <p className="text-[12px] text-text-tertiary">{t.settings.connectHint}</p>
              <button onClick={() => setConnecting(true)} className="text-[13px] font-medium text-accent">
                {t.settings.connect}
              </button>
            </div>
          )}
        </SettingsSection>

        <SettingsSection title={t.settings.publishTitle}>
          <p className="mb-3 text-[13px] text-text-secondary">{t.settings.publishHint}</p>
          <input
            ref={feedUrlInputRef}
            readOnly
            value={feedUrl ?? '…'}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full rounded-lg border border-hairline bg-bg px-3 py-2 font-mono text-[12px] text-text-secondary outline-none focus:border-accent"
          />
          <button
            onClick={copyFeedUrl}
            className="mt-2 rounded-full bg-accent px-3 py-1.5 text-[13px] font-semibold text-bg"
          >
            {copied ? t.settings.copied : t.settings.copyLink}
          </button>
          <p className="mt-3 text-[12px] text-text-tertiary">{t.settings.subscribeSteps}</p>
        </SettingsSection>

        <SettingsSection title={t.settings.passcode}>
          {changingPin ? (
            <div className="flex items-center gap-2">
              <input
                type="tel"
                inputMode="numeric"
                autoFocus
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder={t.settings.newPasscodePlaceholder}
                className="flex-1 rounded-lg border border-hairline bg-bg px-3 py-2 text-[14px] text-text outline-none focus:border-accent"
              />
              <button onClick={savePin} disabled={newPin.length < 4} className="text-[14px] font-semibold text-accent disabled:opacity-40">
                {t.settings.save}
              </button>
              <button onClick={() => setChangingPin(false)} className="text-[14px] text-text-tertiary">
                {t.settings.cancel}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-text">{pinSaved ? t.settings.passcodeUpdated : t.settings.changePasscode}</span>
              <button onClick={() => setChangingPin(true)} className="text-[13px] font-medium text-accent">
                {t.settings.change}
              </button>
            </div>
          )}
        </SettingsSection>

        <button
          onClick={logout}
          className="rounded-2xl border border-hairline bg-surface px-4 py-3 text-center text-[14px] font-medium text-clay"
        >
          {t.settings.logOut}
        </button>
      </div>
    </div>
  )
}
