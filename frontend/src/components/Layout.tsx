import { NavLink, Outlet } from 'react-router-dom'
import { CalendarIcon, GridIcon } from './icons'

const navItems = [
  { to: '/', label: 'Projects', icon: GridIcon, end: true },
  { to: '/calendar', label: 'Calendar', icon: CalendarIcon, end: false },
]

function navLinkClasses(isActive: boolean) {
  return [
    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-surface-raised text-text'
      : 'text-text-muted hover:bg-surface-raised hover:text-text',
  ].join(' ')
}

export default function Layout() {
  return (
    <div className="flex h-full flex-col md:flex-row">
      <nav className="hidden w-56 shrink-0 flex-col border-r border-border bg-surface p-4 md:flex">
        <div className="mb-6 px-2 text-lg font-semibold tracking-tight">🏔️ Fjord</div>
        <div className="flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => navLinkClasses(isActive)}>
              <Icon className="size-5" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
        <span className="text-base font-semibold tracking-tight">🏔️ Fjord</span>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto pb-16 md:pb-0">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 flex border-t border-border bg-surface md:hidden">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium',
                isActive ? 'text-text' : 'text-text-muted',
              ].join(' ')
            }
          >
            <Icon className="size-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
