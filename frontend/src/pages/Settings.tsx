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

type CalendarStatus = {
  configured: boolean
  icloud_username: string | null
  last_synced_at: string | null
  last_error: string | null
}

export default function Settings() {
  const [feedUrl, setFeedUrl] = useState<string | null>(null)
  const [calStatus, setCalStatus] = useState<CalendarStatus | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [copied, setCopied] = useState(false)

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
      await navigator.clipboard.writeText(feedUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard API needs a secure context; the input below is selectable regardless
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
      <h1 className="mb-7 text-[28px] font-bold tracking-tight text-text md:text-[32px]">Settings</h1>

      <div className="flex flex-col gap-6">
        <SettingsSection title="Apple Calendar">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusDot ok={!!calStatus?.configured} />
              <span className="text-[14px] text-text">
                {calStatus?.configured ? `Connected as ${calStatus.icloud_username}` : 'Not connected'}
              </span>
            </div>
            {calStatus?.configured && (
              <button
                onClick={refreshCalendar}
                disabled={refreshing}
                className="rounded-full border border-hairline px-3 py-1 text-[13px] font-medium text-text-secondary disabled:opacity-40"
              >
                {refreshing ? 'Refreshing…' : 'Refresh now'}
              </button>
            )}
          </div>

          {calStatus?.configured ? (
            <>
              <p className="mt-2 text-[12px] text-text-tertiary">
                {calStatus.last_error
                  ? `Last sync failed: ${calStatus.last_error}`
                  : calStatus.last_synced_at
                    ? `Last synced ${new Date(calStatus.last_synced_at).toLocaleString()}`
                    : 'Not synced yet'}
              </p>
              <button onClick={disconnectICloud} className="mt-3 text-[13px] font-medium text-clay">
                Disconnect
              </button>
            </>
          ) : connecting ? (
            <div className="mt-3 flex flex-col gap-2">
              <input
                type="email"
                autoFocus
                value={icloudEmail}
                onChange={(e) => setIcloudEmail(e.target.value)}
                placeholder="you@icloud.com"
                className="rounded-lg border border-hairline bg-bg px-3 py-2 text-[14px] text-text outline-none focus:border-accent"
              />
              <input
                type="password"
                value={icloudPassword}
                onChange={(e) => setIcloudPassword(e.target.value)}
                placeholder="app-specific password"
                className="rounded-lg border border-hairline bg-bg px-3 py-2 text-[14px] text-text outline-none focus:border-accent"
              />
              {connectError && <p className="text-[12px] text-clay">{connectError}</p>}
              <div className="flex items-center gap-3">
                <button
                  onClick={connectICloud}
                  disabled={!icloudEmail || !icloudPassword || connectSubmitting}
                  className="rounded-full bg-accent px-3 py-1.5 text-[13px] font-semibold text-bg disabled:opacity-40"
                >
                  {connectSubmitting ? 'Connecting…' : 'Connect'}
                </button>
                <button onClick={() => setConnecting(false)} className="text-[13px] text-text-tertiary">
                  Cancel
                </button>
              </div>
              <p className="text-[12px] text-text-tertiary">
                Generate an app-specific password at{' '}
                <a href="https://appleid.apple.com" target="_blank" rel="noreferrer" className="text-accent">
                  appleid.apple.com
                </a>{' '}
                — never your main Apple ID password.
              </p>
            </div>
          ) : (
            <div className="mt-2 flex items-center justify-between">
              <p className="text-[12px] text-text-tertiary">Read your existing calendars into Fjord, read-only.</p>
              <button onClick={() => setConnecting(true)} className="text-[13px] font-medium text-accent">
                Connect
              </button>
            </div>
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
