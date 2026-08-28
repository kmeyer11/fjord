import { useEffect, useState } from 'react'
import { api } from '../api/client'

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
  const [feedUrl, setFeedUrl] = useState<string | null>(null)
  const [calStatus, setCalStatus] = useState<{ configured: boolean; last_synced_at: string | null; last_error: string | null } | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [copied, setCopied] = useState(false)

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
      await navigator.clipboard.writeText(feedUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard API needs a secure context; the input below is selectable regardless
    }
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
      <h1 className="mb-7 text-[28px] font-bold tracking-tight text-text md:text-[32px]">Settings</h1>

      <div className="flex flex-col gap-6">
        <SettingsSection title="Apple Calendar">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusDot ok={!!calStatus?.configured} />
              <span className="text-[14px] text-text">
                {calStatus?.configured ? 'Connected' : 'Not connected'}
              </span>
            </div>
            <button
              onClick={refreshCalendar}
              disabled={refreshing || !calStatus?.configured}
              className="rounded-full border border-hairline px-3 py-1 text-[13px] font-medium text-text-secondary disabled:opacity-40"
            >
              {refreshing ? 'Refreshing…' : 'Refresh now'}
            </button>
          </div>
          {calStatus?.configured ? (
            <p className="mt-2 text-[12px] text-text-tertiary">
              {calStatus.last_error
                ? `Last sync failed: ${calStatus.last_error}`
                : calStatus.last_synced_at
                  ? `Last synced ${new Date(calStatus.last_synced_at).toLocaleString()}`
                  : 'Not synced yet'}
            </p>
          ) : (
            <p className="mt-2 text-[12px] text-text-tertiary">
              Set FJORD_ICLOUD_USERNAME and FJORD_ICLOUD_APP_PASSWORD (an app-specific password from
              appleid.apple.com — not your main Apple ID password) on the server, then restart it.
            </p>
          )}
        </SettingsSection>

        <SettingsSection title="Publish to Apple Calendar">
          <p className="mb-3 text-[13px] text-text-secondary">
            Subscribe to this feed once and Fjord's scheduled tasks show up as their own read-only calendar.
          </p>
          <input
            readOnly
            value={feedUrl ?? 'Loading…'}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full rounded-lg border border-hairline bg-bg px-3 py-2 font-mono text-[12px] text-text-secondary outline-none focus:border-accent"
          />
          <button
            onClick={copyFeedUrl}
            className="mt-2 rounded-full bg-accent px-3 py-1.5 text-[13px] font-semibold text-bg"
          >
            {copied ? 'Copied' : 'Copy link'}
          </button>
          <p className="mt-3 text-[12px] text-text-tertiary">
            Mac: File → New Calendar Subscription. iPhone: Settings → Calendar → Accounts → Add Account → Other →
            Add Subscribed Calendar.
          </p>
        </SettingsSection>

        <SettingsSection title="Passcode">
          {changingPin ? (
            <div className="flex items-center gap-2">
              <input
                type="tel"
                inputMode="numeric"
                autoFocus
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="New 4–6 digit passcode"
                className="flex-1 rounded-lg border border-hairline bg-bg px-3 py-2 text-[14px] text-text outline-none focus:border-accent"
              />
              <button onClick={savePin} disabled={newPin.length < 4} className="text-[14px] font-semibold text-accent disabled:opacity-40">
                Save
              </button>
              <button onClick={() => setChangingPin(false)} className="text-[14px] text-text-tertiary">
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-text">{pinSaved ? 'Passcode updated' : 'Change your passcode'}</span>
              <button onClick={() => setChangingPin(true)} className="text-[13px] font-medium text-accent">
                Change
              </button>
            </div>
          )}
        </SettingsSection>

        <button
          onClick={logout}
          className="rounded-2xl border border-hairline bg-surface px-4 py-3 text-center text-[14px] font-medium text-clay"
        >
          Log Out
        </button>
      </div>
    </div>
  )
}
