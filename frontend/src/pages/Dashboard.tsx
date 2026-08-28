import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { ProjectWithCounts } from '../api/types'
import NewProjectModal from '../components/NewProjectModal'
import ProjectCard from '../components/ProjectCard'
import { PlusIcon } from '../components/icons'

export default function Dashboard() {
  const [projects, setProjects] = useState<ProjectWithCounts[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showNewProject, setShowNewProject] = useState(false)

  function reload() {
    api
      .listProjects()
      .then(setProjects)
      .catch((e) => setError(String(e)))
  }

  useEffect(reload, [])

  return (
    <div className="mx-auto max-w-5xl px-4 pb-8 pt-6 md:px-8 md:pt-10">
      <div className="mb-7 flex items-center justify-between">
        <h1 className="text-[28px] font-bold tracking-tight text-text md:text-[32px]">Projects</h1>
        <button
          onClick={() => setShowNewProject(true)}
          className="flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-2 text-[13px] font-semibold text-bg transition-opacity active:opacity-80"
        >
          <PlusIcon className="size-4" />
          New Project
        </button>
      </div>

      {error && <p className="text-sm text-clay">Couldn't load projects: {error}</p>}

      {!error && !projects && <p className="text-sm text-text-secondary">Loading…</p>}

      {projects && projects.length === 0 && (
        <div className="rounded-2xl border border-dashed border-hairline-strong px-6 py-14 text-center">
          <p className="text-sm text-text-secondary">No projects yet — create your first one to start a backlog.</p>
        </div>
      )}

      {projects && projects.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}

      {showNewProject && (
        <NewProjectModal
          onClose={() => setShowNewProject(false)}
          onCreate={async (data) => {
            await api.createProject(data)
            reload()
          }}
        />
      )}
    </div>
  )
}
