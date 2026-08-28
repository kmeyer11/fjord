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
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text">Projects</h1>
        <button
          onClick={() => setShowNewProject(true)}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white"
        >
          <PlusIcon className="size-4" />
          New project
        </button>
      </div>

      {error && <p className="text-sm text-red-400">Couldn't load projects: {error}</p>}

      {!error && !projects && <p className="text-sm text-text-muted">Loading…</p>}

      {projects && projects.length === 0 && (
        <p className="text-sm text-text-muted">No projects yet. Create your first one above.</p>
      )}

      {projects && projects.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
