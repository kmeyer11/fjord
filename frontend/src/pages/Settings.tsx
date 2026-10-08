import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { AppleCalendar, CalendarStatus } from '../api/types'
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

export default function Settings() {
  const { t, locale } = useLanguage()
  const [calStatus, setCalStatus] = useState<CalendarStatus | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [calendars, setCalendars] = useState<AppleCalendar[] | null>(null)
  const [calendarsError, setCalendarsError] = useState<string | null>(null)

  const [connecting, setConnecting] = useState(false)
  const [icloudEmail, setIcloudEmail] = useState('')
  const [icloudPassword, setIcloudPassword] = useState('')
  const [connectError, setConnectError] = useState<string | null>(null)
  const [connectSubmitting, setConnectSubmitting] = useState(false)

  const [changingPin, setChangingPin] = useState(false)
  const [newPin, setNewPin] = useState('')
  const [pinSaved, setPinSaved] = useState(false)

  function loadCalStatus() {
    api.getCalendarStatus().then(setCalStatus)
  }

  useEffect(() => {
    loadCalStatus()
  }, [])

  const configured = !!calStatus?.configured
  useEffect(() => {
    if (!configured) return
    api
      .listCalendars()
      .then(setCalendars)
      .catch((e) => setCalendarsError(e instanceof Error ? e.message : String(e)))
  }, [configured])

  async function chooseTargetCalendar(url: string) {
    setCalendarsError(null)
    try {
      const pushStatus = await api.setTargetCalendar(url || null)
      setCalStatus((prev) => prev && { ...prev, ...pushStatus })
    } catch (e) {
      setCalendarsError(e instanceof Error ? e.message : String(e))
    }
  }

  async function refreshCalendar() {
    setRefreshing(true)
    try {
      const now = new Date()
      const start = new Date(now.getTime() - 7 * 86400_000)
      const end = new Date(now.getTime() + 21 * 86400_000)
      await api.listExternalEvents(start, end, true)
      if (calStatus?.target_calendar) await api.pushCalendar()
      loadCalStatus()
    } finally {
      setRefreshing(false)
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
    if (newPin.length !== 4) return
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
              <div className="mt-4 border-t border-hairline pt-4">
                <label className="flex items-center justify-between gap-3">
                  <span className="text-[14px] text-text">{t.settings.targetCalendar}</span>
                  <select
                    value={calStatus.target_calendar?.url ?? ''}
                    onChange={(e) => chooseTargetCalendar(e.target.value)}
                    disabled={!calendars}
                    className="min-w-0 rounded-lg border border-hairline bg-bg px-3 py-1.5 text-[14px] text-text outline-none focus:border-accent disabled:opacity-40"
                  >
                    {!calendars && <option value={calStatus.target_calendar?.url ?? ''}>{t.settings.loadingCalendars}</option>}
                    {calendars && <option value="">{t.settings.targetNone}</option>}
                    {calendars?.map((c) => (
                      <option key={c.url} value={c.url}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                {calendarsError && <p className="mt-2 text-[12px] text-clay">{calendarsError}</p>}
                {calStatus.target_calendar && (
                  <p className="mt-2 text-[12px] text-text-tertiary">
                    {calStatus.last_push_error ? t.settings.lastPushFailed(calStatus.last_push_error) : t.settings.targetHint}
                  </p>
                )}
              </div>
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

        <SettingsSection title={t.settings.passcode}>
          {changingPin ? (
            <div className="flex items-center gap-2">
              <input
                type="tel"
                inputMode="numeric"
                autoFocus
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder={t.settings.newPasscodePlaceholder}
                className="flex-1 rounded-lg border border-hairline bg-bg px-3 py-2 text-[14px] text-text outline-none focus:border-accent"
              />
              <button onClick={savePin} disabled={newPin.length !== 4} className="text-[14px] font-semibold text-accent disabled:opacity-40">
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
