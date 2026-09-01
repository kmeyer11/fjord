import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { api } from '../api/client'
import type { ProjectWithCounts } from '../api/types'
import { useLanguage } from '../i18n/LanguageContext'
import Logo from './Logo'
import Switch from './Switch'
import { CalendarIcon, GearIcon, GlobeIcon, GridIcon, StarIcon } from './icons'

function sidebarLinkClasses(isActive: boolean) {
  return [
    'flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors',
    isActive ? 'bg-accent-soft text-accent-strong' : 'text-text-secondary hover:bg-black/[0.04] hover:text-text',
  ].join(' ')
}

function favoriteLinkClasses(isActive: boolean) {
  return [
    'flex items-center gap-2 rounded-lg py-1.5 pl-8 pr-3 text-[13px] font-medium transition-colors',
    isActive ? 'bg-accent-soft text-accent-strong' : 'text-text-secondary hover:bg-black/[0.04] hover:text-text',
  ].join(' ')
}

function useFavoriteProjects() {
  const [projects, setProjects] = useState<ProjectWithCounts[]>([])

  useEffect(() => {
    let cancelled = false
    function reload() {
      api
        .listProjects()
        .then((all) => {
          if (!cancelled) setProjects(all.filter((p) => p.favorite))
        })
        .catch(() => {
          // Sidebar favorites are a convenience shortcut — silently skip on failure,
          // the Projects page itself already surfaces any real error.
        })
    }
    reload()
    window.addEventListener('fjord:projects-changed', reload)
    return () => {
      cancelled = true
      window.removeEventListener('fjord:projects-changed', reload)
    }
  }, [])

  return projects
}

function tabLinkClasses(isActive: boolean) {
  return [
    'flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors',
    isActive ? 'text-accent-strong' : 'text-text-tertiary',
  ].join(' ')
}

function LanguageToggle() {
  const { t, language, setLanguage } = useLanguage()
  return (
    <div className="flex items-center justify-between rounded-lg px-3 py-1.5">
      <span className="flex items-center gap-2.5 text-[13px] font-medium text-text-secondary">
        <GlobeIcon className="size-[18px]" />
        {language === 'da' ? 'Oversæt?' : 'Translate?'}
      </span>
      <Switch checked={language === 'da'} onChange={(checked) => setLanguage(checked ? 'da' : 'en')} label={t.settings.language} />
    </div>
  )
}

export default function Layout() {
  const { t } = useLanguage()
  const favoriteProjects = useFavoriteProjects()
  const navItems = [
    { to: '/projects', label: t.nav.projects, icon: GridIcon, end: true },
    { to: '/calendar', label: t.nav.calendar, icon: CalendarIcon, end: false },
    { to: '/settings', label: t.nav.settings, icon: GearIcon, end: false },
  ]

  return (
    <div className="flex h-full flex-col md:flex-row">
      <nav className="hidden w-52 shrink-0 flex-col gap-6 border-r border-hairline bg-surface/60 p-4 backdrop-blur-xl md:flex">
        <Link to="/" className="flex items-center gap-2 px-1">
          <Logo className="size-6" />
          <span className="text-[15px] font-semibold tracking-tight text-text">Fjord</span>
        </Link>
        <div className="flex flex-col gap-0.5">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <div key={to}>
              <NavLink to={to} end={end} className={({ isActive }) => sidebarLinkClasses(isActive)}>
                <Icon className="size-[18px]" />
                {label}
              </NavLink>
              {to === '/projects' && favoriteProjects.length > 0 && (
                <div className="mt-0.5 flex flex-col gap-0.5">
                  {favoriteProjects.map((p) => (
                    <NavLink key={p.id} to={`/projects/${p.id}`} className={({ isActive }) => favoriteLinkClasses(isActive)}>
                      <StarIcon className="size-3.5 shrink-0 text-amber-400" filled />
                      <span className="truncate">{p.name}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-auto border-t border-hairline pt-3">
          <LanguageToggle />
        </div>
      </nav>

      <header className="flex items-center gap-2 border-b border-hairline bg-surface/70 px-4 py-3 backdrop-blur-xl md:hidden">
        <Link to="/" className="flex items-center gap-2">
          <Logo className="size-[22px]" />
          <span className="text-[17px] font-semibold tracking-tight text-text">Fjord</span>
        </Link>
        <div className="ml-auto">
          <LanguageToggle />
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto pb-[calc(3.75rem+env(safe-area-inset-bottom))] md:pb-0">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-hairline bg-surface/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => tabLinkClasses(isActive)}>
            <Icon className="size-[22px]" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
