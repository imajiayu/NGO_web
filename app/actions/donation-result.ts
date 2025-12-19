'use server'

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Get the public URL for a donation result image
 * Returns the first image found in the donation's folder
 */
export async function getDonationResultUrl(donationPublicId: string) {
  try {
    // Use service role client to bypass RLS
    // This is safe because we only return public information (image URLs for completed donations)
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { persistSession: false }
      }
    )

    console.log('[getDonationResultUrl] Starting for donation:', donationPublicId)

    // Validate input
    if (!donationPublicId || donationPublicId.trim() === '') {
      console.log('[getDonationResultUrl] Invalid donation ID')
      return { error: 'invalidDonationId' }
    }

    // First, verify the donation exists and is completed
    const { data: donation, error: donationError } = await supabase
      .from('donations')
      .select('donation_status')
      .eq('donation_public_id', donationPublicId)
      .single()

    console.log('[getDonationResultUrl] Donation query result:', { donation, donationError })

    if (donationError || !donation) {
      console.log('[getDonationResultUrl] Donation not found')
      return { error: 'donationNotFound' }
    }

    if (donation.donation_status !== 'completed') {
      console.log('[getDonationResultUrl] Donation not completed, status:', donation.donation_status)
      return { error: 'notCompleted' }
    }

    // List files in the donation folder
    console.log('[getDonationResultUrl] Listing files in folder:', donationPublicId)
    const { data: files, error: storageError } = await supabase
      .storage
      .from('donation-results')
      .list(donationPublicId, {
        limit: 10,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    console.log('[getDonationResultUrl] Storage list result:', { files, storageError })

    if (storageError) {
      console.error('[getDonationResultUrl] Storage error:', storageError)
      return { error: 'storageFailed', details: storageError.message }
    }

    // Check if any files exist
    if (!files || files.length === 0) {
      console.log('[getDonationResultUrl] No files found in folder')
      return { error: 'noImage' }
    }

    console.log('[getDonationResultUrl] Found files:', files.map(f => f.name))

    // Get the public URL for the first file
    const filePath = `${donationPublicId}/${files[0].name}`
    console.log('[getDonationResultUrl] Getting public URL for path:', filePath)

    const { data: urlData } = supabase
      .storage
      .from('donation-results')
      .getPublicUrl(filePath)

    console.log('[getDonationResultUrl] Public URL result:', urlData)

    if (!urlData || !urlData.publicUrl) {
      console.log('[getDonationResultUrl] Failed to get public URL')
      return { error: 'urlFailed' }
    }

    console.log('[getDonationResultUrl] Success! URL:', urlData.publicUrl)

    return {
      url: urlData.publicUrl,
      fileName: files[0].name
    }
  } catch (error) {
    console.error('[getDonationResultUrl] Error:', error)
    return { error: 'serverError', details: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Check if a donation has a result image
 */
export async function hasDonationResult(donationPublicId: string): Promise<boolean> {
  try {
    // Use service role client to bypass RLS
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { persistSession: false }
      }
    )

    const { data: files } = await supabase
      .storage
      .from('donation-results')
      .list(donationPublicId, {
        limit: 1
      })

    return (files && files.length > 0) || false
  } catch (error) {
    console.error('Error checking donation result:', error)
    return false
  }
}
