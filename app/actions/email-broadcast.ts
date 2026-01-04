/**
 * Email Broadcast Server Actions
 * Admin-only functionality for sending newsletter broadcasts
 */

'use server'

import { createServerClient } from '@/lib/supabase/server'
import { sendBroadcastEmail } from '@/lib/email/broadcast'
import { getAvailableTemplates, getEmailTemplate } from '@/lib/email/templates'
import { z } from 'zod'
import type { DonationLocale } from '@/types'

type Locale = DonationLocale

// ==================== Types ====================

export interface BroadcastRecipient {
  email: string
  locale: Locale
}

export interface SendBroadcastParams {
  templateName: string
  recipients?: BroadcastRecipient[] // If not provided, sends to all subscribed users
  variables?: Record<string, string> // Template variables (e.g., project_name, donate_url)
  testMode?: boolean // If true, only sends to first recipient for testing
}

export interface BroadcastResult {
  success: boolean
  sent: number
  failed: number
  errors?: Array<{ email: string; error: string }>
}

// ==================== Validation ====================

const sendBroadcastSchema = z.object({
  templateName: z.string().min(1, 'Template name is required'),
  variables: z.record(z.string()).optional(),
  testMode: z.boolean().optional()
})

// ==================== Helper Functions ====================

/**
 * Get all subscribed recipients from database
 */
async function getSubscribedRecipients(): Promise<BroadcastRecipient[]> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('email_subscriptions')
    .select('email, locale')
    .eq('is_subscribed', true)

  if (error) {
    console.error('Error fetching recipients:', error)
    throw new Error('Failed to fetch recipients')
  }

  return data as BroadcastRecipient[]
}

/**
 * Verify admin permission
 */
async function requireAdmin(): Promise<void> {
  const supabase = await createServerClient()

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized: Admin access required')
  }

  // Additional check using is_admin() function
  const { data, error } = await supabase.rpc('is_admin')

  if (error || !data) {
    throw new Error('Unauthorized: Admin access required')
  }
}

// ==================== Server Actions ====================

/**
 * Send broadcast email to all subscribed users or specific recipients
 * Admin only
 */
export async function sendEmailBroadcast(
  params: SendBroadcastParams
): Promise<{ data: BroadcastResult | null; error?: string }> {
  try {
    // Verify admin permission
    await requireAdmin()

    // Validate input
    const validated = sendBroadcastSchema.parse(params)

    // Verify template exists
    const template = getEmailTemplate(validated.templateName)
    if (!template) {
      return {
        data: null,
        error: `Template "${validated.templateName}" not found`
      }
    }

    // Get recipients
    let recipients: BroadcastRecipient[]

    if (params.recipients && params.recipients.length > 0) {
      recipients = params.recipients
    } else {
      recipients = await getSubscribedRecipients()
    }

    if (recipients.length === 0) {
      return {
        data: { success: true, sent: 0, failed: 0 },
        error: 'No recipients found'
      }
    }

    // Test mode: only send to first recipient
    if (params.testMode) {
      recipients = recipients.slice(0, 1)
      console.log('Test mode: sending to', recipients[0].email)
    }

    // Group recipients by locale for batch sending
    const recipientsByLocale = recipients.reduce(
      (acc, recipient) => {
        if (!acc[recipient.locale]) {
          acc[recipient.locale] = []
        }
        acc[recipient.locale].push(recipient.email)
        return acc
      },
      {} as Record<Locale, string[]>
    )

    // Send emails for each locale
    const results: BroadcastResult = {
      success: true,
      sent: 0,
      failed: 0,
      errors: []
    }

    for (const [locale, emails] of Object.entries(recipientsByLocale)) {
      try {
        const result = await sendBroadcastEmail({
          template,
          locale: locale as Locale,
          recipients: emails,
          variables: validated.variables
        })

        results.sent += result.successCount
        results.failed += result.failureCount
        results.errors?.push(...result.errors)
      } catch (error) {
        console.error(`Failed to send broadcast for locale ${locale}:`, error)
        results.failed += emails.length
        emails.forEach((email) => {
          results.errors?.push({
            email,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        })
      }
    }

    results.success = results.failed === 0

    console.log('Broadcast complete:', {
      template: validated.templateName,
      sent: results.sent,
      failed: results.failed,
      testMode: params.testMode
    })

    return { data: results }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { data: null, error: error.errors[0].message }
    }

    console.error('Broadcast error:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to send broadcast'
    }
  }
}

/**
 * Get list of available broadcast templates
 * Admin only
 */
export async function getAvailableBroadcastTemplates(): Promise<{
  data: Array<{ name: string; fileName: string }> | null
  error?: string
}> {
  try {
    // Verify admin permission
    await requireAdmin()

    const templates = getAvailableTemplates()

    return { data: templates }
  } catch (error) {
    console.error('Error fetching templates:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch templates'
    }
  }
}

/**
 * Preview email template with variables
 * Admin only
 */
export async function previewEmailTemplate(
  templateName: string,
  locale: Locale,
  variables?: Record<string, string>
): Promise<{ data: { subject: string; html: string } | null; error?: string }> {
  try {
    // Verify admin permission
    await requireAdmin()

    const template = getEmailTemplate(templateName)
    if (!template) {
      return { data: null, error: `Template "${templateName}" not found` }
    }

    // Load template content
    const { getCompleteEmailTemplate, replaceTemplateVariables } = await import(
      '@/lib/email/templates'
    )

    const result = getCompleteEmailTemplate(templateName)
    if (!result) {
      return { data: null, error: `Template "${templateName}" not found` }
    }

    // Get HTML content for the specified locale
    const htmlContent = result.content[locale]
    if (!htmlContent) {
      return { data: null, error: `Content for locale "${locale}" not found` }
    }

    // Replace variables in HTML
    const processedHtml = replaceTemplateVariables(htmlContent, variables || {})

    return {
      data: {
        subject: result.template.subject[locale],
        html: processedHtml
      }
    }
  } catch (error) {
    console.error('Preview error:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to preview template'
    }
  }
}
