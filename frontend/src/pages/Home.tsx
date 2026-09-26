import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import FjordScene from '../components/fjord-scene/FjordScene'
import { DEFAULT_PRESET, PRESETS } from '../components/fjord-scene/presets'
import { TIMES_OF_DAY, timeOfDayFor } from '../components/fjord-scene/timeOfDay'
import type { TimeOfDay } from '../components/fjord-scene/types'
import { useLanguage } from '../i18n/LanguageContext'
import { taskColor } from '../lib/colors'
import { addDays, isSameDay } from '../lib/date'

const MAX_ITEMS = 4
const EXTERNAL_EVENT_COLOR = '#838d95'

interface TodayItem {
  key: string
  title: string
  color: string
  /** Meetings and external events open the calendar; tasks open their project's board. */
  to: string
  /** null for all-day items. */
  start: Date | null
  end: Date | null
}

function useToday(now: Date): TodayItem[] | null {
  const [items, setItems] = useState<TodayItem[] | null>(null)
  const dayKey = now.toDateString()

  useEffect(() => {
    let cancelled = false
    const dayStart = new Date(now)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = addDays(dayStart, 1)

    Promise.all([
      api.listTasks(),
      api.listProjects(),
      // The iCloud calendar is optional — a failure here just means no external events.
      api.listExternalEvents(dayStart, dayEnd).catch(() => []),
    ])
      .then(([tasks, projects, events]) => {
        if (cancelled) return
        const projectColors = new Map(projects.map((p) => [p.id, p.color]))
        const fromTasks: TodayItem[] = tasks
          .filter((t) => t.due_at && t.status !== 'done' && !t.archived_at && isSameDay(new Date(t.due_at), dayStart))
          .map((t) => ({
            key: `task-${t.id}`,
            title: t.title,
            color: taskColor(t, projectColors),
            to: t.category === 'meeting' || t.project_id == null ? '/calendar' : `/projects/${t.project_id}`,
            start: t.all_day ? null : new Date(t.due_at!),
            end: null,
          }))
        const fromEvents: TodayItem[] = events
          .filter((e) => new Date(e.start) < dayEnd && new Date(e.end) > dayStart)
          .map((e) => ({
            key: `event-${e.id}`,
            title: e.title,
            color: e.calendar_color ?? EXTERNAL_EVENT_COLOR,
            to: '/calendar',
            start: e.all_day ? null : new Date(e.start),
            end: e.all_day ? null : new Date(e.end),
          }))
        setItems(
          [...fromTasks, ...fromEvents].sort(
            (a, b) => (a.start?.getTime() ?? -Infinity) - (b.start?.getTime() ?? -Infinity),
          ),
        )
      })
      .catch(() => {
        if (!cancelled) setItems([])
      })
    return () => {
      cancelled = true
    }
    // Refetch when the day rolls over, not on every minute tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayKey])

  return items
}

function useNow(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])
  return now
}

/**
 * The front-page scene the user last blew their way to (by clicking a cloud).
 * Stored server-side so it follows them across devices; null while loading,
 * so the canvas doesn't flash the default scene first.
 */
function useSceneChoice(): [string | null, (name: string) => void] {
  const [scene, setScene] = useState<string | null>(null)
  useEffect(() => {
    api
      .getPreferences()
      .then((prefs) => setScene(prefs.scene && prefs.scene in PRESETS ? prefs.scene : DEFAULT_PRESET))
      .catch(() => setScene(DEFAULT_PRESET))
  }, [])
  const choose = useCallback((name: string) => {
    setScene(name)
    // Worst case the choice just doesn't survive a reload — not worth an error.
    api.updatePreferences({ scene: name }).catch(() => {})
  }, [])
  return [scene, choose]
}

function nextOf<T>(list: T[], current: T): T {
  return list[(list.indexOf(current) + 1) % list.length]
}

export default function Home() {
  const { t, locale } = useLanguage()
  const now = useNow()
  const items = useToday(now)
  const [scene, chooseScene] = useSceneChoice()
  // Clicking the sun/moon cycles this; it's deliberately not saved, so a reload goes back to the clock.
  const [timeOverride, setTimeOverride] = useState<TimeOfDay | null>(null)

  const sceneRef = useRef(scene)
  useEffect(() => {
    sceneRef.current = scene
  })

  const onEgg = useCallback(
    (kind: string) => {
      if (kind === 'sun') {
        setTimeOverride((current) => nextOf(TIMES_OF_DAY, current ?? timeOfDayFor(new Date())))
      } else if (kind.startsWith('cloud:')) {
        // Let the cloud whoosh off-screen first, then the wind carries you to the next scene.
        setTimeout(() => {
          if (sceneRef.current) chooseScene(nextOf(Object.keys(PRESETS), sceneRef.current))
        }, 500)
      }
    },
    [chooseScene],
  )

  const time = timeOverride ?? timeOfDayFor(now)

  const visible = items?.slice(0, MAX_ITEMS) ?? []
  const hidden = (items?.length ?? 0) - visible.length

  return (
    <div className="relative h-full overflow-hidden">
      <div className="absolute inset-0">
        {scene && <FjordScene preset={PRESETS[scene]} time={time} onEgg={onEgg} />}
      </div>

      <div className="relative m-4 max-w-[360px] rounded-2xl border border-hairline bg-surface/70 p-4 shadow-sm backdrop-blur-xl md:m-8">
        <p className="text-[17px] font-semibold text-text">{t.home.greeting[timeOfDayFor(now)]}</p>
        <p className="text-[13px] text-text-tertiary">
          {now.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>

        {items !== null && (
          <div className="mt-3 border-t border-hairline pt-2">
            {visible.length === 0 ? (
              <p className="py-1 text-[14px] text-text-secondary">{t.home.empty}</p>
            ) : (
              <ul>
                {visible.map((item) => {
                  const past = (item.end ?? item.start) !== null && (item.end ?? item.start)! < now
                  return (
                    <li key={item.key}>
                      <Link
                        to={item.to}
                        className={['flex items-center gap-2.5 py-1 text-[14px]', past ? 'opacity-50' : ''].join(' ')}
                      >
                        <span className="w-[4.5rem] shrink-0 whitespace-nowrap text-[12px] tabular-nums text-text-tertiary">
                          {item.start
                            ? item.start.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
                            : t.calendar.allDay}
                        </span>
                        <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="truncate text-text">{item.title}</span>
                      </Link>
                    </li>
                  )
                })}
                {hidden > 0 && (
                  <li>
                    <Link to="/calendar" className="flex items-center gap-2.5 py-1 text-[13px] text-accent">
                      {/* Spacers matching the time column and dot, so this lines up under the titles. */}
                      <span className="w-[4.5rem] shrink-0" />
                      <span className="size-2 shrink-0" />
                      {t.home.more(hidden)}
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </div>
        )}
      </div>

    </div>
  )
}
