import { readFile } from 'fs/promises'
import { join } from 'path'

export interface ProjectContentMeta {
  title: string
  subtitle: string
}

export async function loadProjectContentMeta(
  projectId: number,
  locale: string
): Promise<ProjectContentMeta | null> {
  try {
    const filePath = join(
      process.cwd(),
      'public',
      'content',
      'projects',
      `project-${projectId}-${locale}.json`
    )
    const raw = await readFile(filePath, 'utf-8')
    const json = JSON.parse(raw) as Partial<ProjectContentMeta>
    if (!json.title || !json.subtitle) return null
    return { title: json.title, subtitle: json.subtitle }
  } catch {
    return null
  }
}
