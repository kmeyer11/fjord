import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Calendar from './pages/Calendar'
import Dashboard from './pages/Dashboard'
import ProjectBoard from './pages/ProjectBoard'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/projects/:projectId" element={<ProjectBoard />} />
        <Route path="/calendar" element={<Calendar />} />
      </Route>
    </Routes>
  )
}
