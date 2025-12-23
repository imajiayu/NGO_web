import { createServerClient } from './server'
import type {
  Project,
  Donation,
  ProjectStats,
  ProjectFilters,
  DonationFilters,
} from '@/types'

// ============= PROJECT QUERIES =============

export async function getProjects(filters?: ProjectFilters) {
  const supabase = await createServerClient()
  let query = supabase.from('projects').select('*')

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.location) {
    query = query.eq('location', filters.location)
  }

  if (filters?.is_long_term !== undefined) {
    query = query.eq('is_long_term', filters.is_long_term)
  }

  if (filters?.search) {
    query = query.or(`project_name.ilike.%${filters.search}%,location.ilike.%${filters.search}%`)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) throw error
  return data as Project[]
}

export async function getProjectById(id: number) {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Project
}

export async function getActiveProjects() {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Project[]
}

export async function getProjectStats(projectId?: number) {
  const supabase = await createServerClient()
  let query = supabase.from('project_stats').select('*')

  if (projectId) {
    query = query.eq('id', projectId)
  }

  const { data, error } = await query

  if (error) throw error
  return projectId ? (data[0] as ProjectStats) : (data as ProjectStats[])
}

export async function getAllProjectsWithStats(filters?: ProjectFilters) {
  const supabase = await createServerClient()
  let query = supabase.from('project_stats').select('*')

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.location) {
    query = query.eq('location', filters.location)
  }

  if (filters?.is_long_term !== undefined) {
    query = query.eq('is_long_term', filters.is_long_term)
  }

  const { data, error } = await query

  if (error) throw error

  // Sort by status: active first, then others
  const sortedData = (data as ProjectStats[]).sort((a, b) => {
    const statusOrder: Record<string, number> = {
      active: 0,
      planned: 1,
      completed: 2,
      paused: 3
    }
    return (statusOrder[a.status || 'paused'] || 999) - (statusOrder[b.status || 'paused'] || 999)
  })

  return sortedData
}

// ============= DONATION QUERIES =============

export async function getDonations(filters?: DonationFilters) {
  const supabase = await createServerClient()
  let query = supabase.from('donations').select('*, projects(id, project_name, project_name_i18n, location, location_i18n, unit_name, unit_name_i18n)')

  if (filters?.project_id) {
    query = query.eq('project_id', filters.project_id)
  }

  if (filters?.status) {
    query = query.eq('donation_status', filters.status)
  }

  if (filters?.donor_email) {
    query = query.eq('donor_email', filters.donor_email)
  }

  if (filters?.date_from) {
    query = query.gte('donated_at', filters.date_from)
  }

  if (filters?.date_to) {
    query = query.lte('donated_at', filters.date_to)
  }

  const { data, error } = await query.order('donated_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getDonationByPublicId(publicId: string) {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('donations')
    .select('*, projects(id, project_name, project_name_i18n, location, location_i18n, unit_name, unit_name_i18n)')
    .eq('donation_public_id', publicId)
    .single()

  if (error) throw error
  return data
}

export async function getDonationsByEmail(email: string) {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('donations')
    .select('*, projects(id, project_name, project_name_i18n, location, location_i18n, unit_name, unit_name_i18n)')
    .eq('donor_email', email)
    .order('donated_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getProjectDonations(projectId: number, limit = 50) {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('public_project_donations')
    .select('*')
    .eq('project_id', projectId)
    .order('donated_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

// ============= CREATE OPERATIONS =============

export async function createProject(projectData: {
  project_name: string
  location: string
  start_date: string
  end_date?: string | null
  is_long_term?: boolean
  target_units: number
  unit_name?: string
  status?: 'planned' | 'active'
}) {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('projects')
    // @ts-expect-error - Supabase generated types are overly restrictive
    .insert(projectData)
    .select()
    .single()

  if (error) throw error
  return data as Project
}

export async function createDonation(donationData: {
  donation_public_id: string
  project_id: number
  donor_name: string
  donor_email: string
  donor_phone?: string | null
  amount: number
  currency?: string
  payment_method?: string
  donation_status?: 'paid' | 'confirmed' | 'delivering' | 'completed' | 'refunding' | 'refunded'
  locale?: 'en' | 'zh' | 'ua'
}) {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('donations')
    .insert(donationData)
    .select()
    .single()

  if (error) throw error
  return data as Donation
}

// ============= UPDATE OPERATIONS =============

export async function updateProject(
  projectId: number,
  updates: Partial<Project>
) {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .select()
    .single()

  if (error) throw error
  return data as Project
}

export async function updateDonationStatus(
  donationId: number,
  status: 'paid' | 'confirmed' | 'delivering' | 'completed' | 'refunding' | 'refunded'
) {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('donations')
    .update({ donation_status: status })
    .eq('id', donationId)
    .select()
    .single()

  if (error) throw error
  return data as Donation
}

// ============= HELPER FUNCTIONS =============

export async function generateDonationPublicId(projectId: number) {
  const supabase = await createServerClient()
  const { data, error } = await supabase.rpc('generate_donation_public_id', {
    project_id_input: projectId,
  } as any)

  if (error) throw error
  return data as string
}
