import { z } from 'zod'

// Project validation schemas
export const createProjectSchema = z.object({
  project_name: z.string().min(3, 'Project name must be at least 3 characters').max(255),
  location: z.string().min(2, 'Location is required').max(255),
  start_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
  end_date: z.string().optional().nullable().refine(
    (date) => !date || !isNaN(Date.parse(date)),
    { message: 'Invalid date format' }
  ),
  is_long_term: z.boolean().optional().default(false),
  target_units: z.number().int().min(1, 'Target units must be at least 1'),
  unit_name: z.string().max(50).optional().default('kit'),
  status: z.enum(['planned', 'active']).optional().default('planned'),
})

export const updateProjectSchema = z.object({
  project_name: z.string().min(3).max(255).optional(),
  location: z.string().min(2).max(255).optional(),
  start_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }).optional(),
  end_date: z.string().nullable().refine(
    (date) => !date || !isNaN(Date.parse(date)),
    { message: 'Invalid date format' }
  ).optional(),
  is_long_term: z.boolean().optional(),
  target_units: z.number().int().min(1).optional(),
  current_units: z.number().int().min(0).optional(),
  unit_name: z.string().max(50).optional(),
  status: z.enum(['planned', 'active', 'completed', 'paused']).optional(),
})

// Donation validation schemas
export const createDonationSchema = z.object({
  project_id: z.number().int().positive('Project ID is required'),
  donor_name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  donor_email: z.string().email('Invalid email address').max(255),
  donor_phone: z.string().max(50).optional().nullable(),
  amount: z.number().positive('Amount must be greater than 0'),
  currency: z.string().length(3).toUpperCase().optional().default('USD'),
  payment_method: z.string().max(50).optional(),
})

export const donationFormSchema = z.object({
  project_id: z.number().int().positive(),
  quantity: z.number().int().min(1).max(999),
  donor_name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  donor_email: z.string().email('Invalid email address'),
  donor_message: z.string().max(1000).optional(),
  contact_telegram: z.string().max(255).optional(),
  contact_whatsapp: z.string().max(255).optional(),
  locale: z.enum(['en', 'zh']),
})

export const updateDonationStatusSchema = z.object({
  donation_status: z.enum(['pending', 'confirmed', 'delivering', 'completed']),
})

// Filter validation schemas
export const projectFiltersSchema = z.object({
  status: z.enum(['planned', 'active', 'completed', 'paused']).optional(),
  location: z.string().optional(),
  is_long_term: z.boolean().optional(),
  search: z.string().optional(),
})

export const donationFiltersSchema = z.object({
  project_id: z.number().int().positive().optional(),
  status: z.enum(['pending', 'confirmed', 'delivering', 'completed']).optional(),
  donor_email: z.string().email().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
})

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  page_size: z.number().int().min(1).max(100).default(10),
})

// Export types inferred from schemas
export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
export type CreateDonationInput = z.infer<typeof createDonationSchema>
export type DonationFormInput = z.infer<typeof donationFormSchema>
export type ProjectFilters = z.infer<typeof projectFiltersSchema>
export type DonationFilters = z.infer<typeof donationFiltersSchema>
export type PaginationParams = z.infer<typeof paginationSchema>
