import { NavLink, Outlet } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import Logo from './Logo'
import Switch from './Switch'
import { CalendarIcon, GearIcon, GlobeIcon, GridIcon } from './icons'

function sidebarLinkClasses(isActive: boolean) {
  return [
    'flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors',
    isActive ? 'bg-accent-soft text-accent-strong' : 'text-text-secondary hover:bg-black/[0.04] hover:text-text',
  ].join(' ')
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
        {language === 'da' ? 'Dansk' : 'English'}
      </span>
      <Switch checked={language === 'da'} onChange={(checked) => setLanguage(checked ? 'da' : 'en')} label={t.settings.language} />
    </div>
  )
}

export default function Layout() {
  const { t } = useLanguage()
  const navItems = [
    { to: '/', label: t.nav.projects, icon: GridIcon, end: true },
    { to: '/calendar', label: t.nav.calendar, icon: CalendarIcon, end: false },
    { to: '/settings', label: t.nav.settings, icon: GearIcon, end: false },
  ]

  return (
    <div className="flex h-full flex-col md:flex-row">
      <nav className="hidden w-52 shrink-0 flex-col gap-6 border-r border-hairline bg-surface/60 p-4 backdrop-blur-xl md:flex">
        <div className="flex items-center gap-2 px-1">
          <Logo className="size-6" />
          <span className="text-[15px] font-semibold tracking-tight text-text">Fjord</span>
        </div>
        <div className="flex flex-col gap-0.5">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => sidebarLinkClasses(isActive)}>
              <Icon className="size-[18px]" />
              {label}
            </NavLink>
          ))}
        </div>

        <div className="mt-auto border-t border-hairline pt-3">
          <LanguageToggle />
        </div>
      </nav>

      <header className="flex items-center gap-2 border-b border-hairline bg-surface/70 px-4 py-3 backdrop-blur-xl md:hidden">
        <Logo className="size-[22px]" />
        <span className="text-[17px] font-semibold tracking-tight text-text">Fjord</span>
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
