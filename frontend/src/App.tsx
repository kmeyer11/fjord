import { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { api, UNAUTHORIZED_EVENT } from './api/client'
import Layout from './components/Layout'
import Logo from './components/Logo'
import Calendar from './pages/Calendar'
import Dashboard from './pages/Dashboard'
import Home from './pages/Home'
import Login from './pages/Login'
import ProjectArchive from './pages/ProjectArchive'
import ProjectBoard from './pages/ProjectBoard'
import Settings from './pages/Settings'

type AuthState = 'loading' | 'locked' | 'unlocked'

export default function App() {
  const [authState, setAuthState] = useState<AuthState>('loading')
  const [pinSet, setPinSet] = useState(false)

  useEffect(() => {
    api
      .getAuthStatus()
      .then((s) => {
        setPinSet(s.pin_set)
        setAuthState(s.authenticated ? 'unlocked' : 'locked')
      })
      .catch(() => setAuthState('locked'))

    const onUnauthorized = () => setAuthState('locked')
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
  }, [])

  if (authState === 'loading') {
    return (
      <div className="flex h-full items-center justify-center">
        <Logo className="size-8 opacity-50" />
      </div>
    )
  }

  if (authState === 'locked') {
    return (
      <Login
        pinSet={pinSet}
        onSuccess={() => {
          setPinSet(true)
          setAuthState('unlocked')
        }}
      />
    )
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/projects" element={<Dashboard />} />
        <Route path="/projects/:projectId" element={<ProjectBoard />} />
        <Route path="/projects/:projectId/archive" element={<ProjectArchive />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
