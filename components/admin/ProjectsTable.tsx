'use client'

import { useState } from 'react'
import type { Database } from '@/types/database'
import ProjectEditModal from './ProjectEditModal'
import { createProject } from '@/app/actions/admin'

type Project = Database['public']['Tables']['projects']['Row']

interface Props {
  initialProjects: Project[]
}

export default function ProjectsTable({ initialProjects }: Props) {
  const [projects, setProjects] = useState(initialProjects)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleEdit = (project: Project) => {
    setEditingProject(project)
  }

  const handleCreateNew = async () => {
    setLoading(true)
    try {
      // 创建默认项目
      const newProject = await createProject({
        project_name: 'New Project',
        location: 'New Location',
        start_date: new Date().toISOString().split('T')[0],
        unit_price: 100,
        target_units: 10,
        status: 'planned',
      })
      setProjects([newProject, ...projects])
      setEditingProject(newProject)
    } catch (err: any) {
      console.error('Failed to create project:', err)
      alert(`Failed to create project: ${err.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSaved = (updated: Project) => {
    setProjects(projects.map((p) => (p.id === updated.id ? updated : p)))
    setEditingProject(null)
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="mb-4">
          <button
            onClick={handleCreateNew}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create New Project'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Project Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projects.map((project) => (
                <tr
                  key={project.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleEdit(project)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {project.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {project.project_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {project.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        project.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : project.status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {project.current_units} / {project.target_units || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(project)
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingProject && (
        <ProjectEditModal
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
