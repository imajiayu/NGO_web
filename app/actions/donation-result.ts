'use server'

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { canViewResult, type DonationStatus } from '@/lib/donation-status'

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

    if (!canViewResult(donation.donation_status as DonationStatus)) {
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
 * Get all donation result files with their thumbnails
 * Returns array of files with original and thumbnail URLs
 */
export async function getAllDonationResultFiles(donationPublicId: string) {
  try {
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { persistSession: false }
      }
    )

    console.log('[getAllDonationResultFiles] Starting for donation:', donationPublicId)

    // Validate input
    if (!donationPublicId || donationPublicId.trim() === '') {
      console.log('[getAllDonationResultFiles] Invalid donation ID')
      return { error: 'invalidDonationId', files: [] }
    }

    // Verify the donation exists and is completed
    const { data: donation, error: donationError } = await supabase
      .from('donations')
      .select('donation_status')
      .eq('donation_public_id', donationPublicId)
      .single()

    if (donationError || !donation) {
      console.log('[getAllDonationResultFiles] Donation not found')
      return { error: 'donationNotFound', files: [] }
    }

    if (!canViewResult(donation.donation_status as DonationStatus)) {
      console.log('[getAllDonationResultFiles] Donation not completed, status:', donation.donation_status)
      return { error: 'notCompleted', files: [] }
    }

    // List all files in the donation folder (excluding .thumbnails subfolder)
    const { data: files, error: storageError } = await supabase
      .storage
      .from('donation-results')
      .list(donationPublicId, {
        sortBy: { column: 'name', order: 'asc' }  // 按文件名排序（时间戳）
      })

    if (storageError) {
      console.error('[getAllDonationResultFiles] Storage error:', storageError)
      return { error: 'storageFailed', files: [] }
    }

    if (!files || files.length === 0) {
      console.log('[getAllDonationResultFiles] No files found')
      return { error: 'noImage', files: [] }
    }

    // Filter out the .thumbnails folder itself
    const originalFiles = files.filter(file => file.name !== '.thumbnails')

    // List thumbnail files
    const { data: thumbnailFiles } = await supabase
      .storage
      .from('donation-results')
      .list(`${donationPublicId}/.thumbnails`, {
        sortBy: { column: 'name', order: 'asc' }  // 按文件名排序（时间戳）
      })

    // Build file objects with original and thumbnail URLs
    const fileObjects = originalFiles.map((file, index) => {
      const filePath = `${donationPublicId}/${file.name}`
      const { data: { publicUrl } } = supabase.storage
        .from('donation-results')
        .getPublicUrl(filePath)

      // Try to find matching thumbnail
      const fileTimestamp = file.name.split('.')[0]
      let thumbnailUrl = null

      if (thumbnailFiles && thumbnailFiles.length > 0) {
        // 方法1: 精确匹配时间戳
        let matchingThumb = thumbnailFiles.find(thumb =>
          thumb.name.startsWith(fileTimestamp + '_thumb.')
        )

        // 方法2: 如果没找到精确匹配，使用索引匹配（对于旧文件）
        // 假设缩略图和原始文件的顺序相同
        if (!matchingThumb && index < thumbnailFiles.length) {
          matchingThumb = thumbnailFiles[index]
        }

        // 方法3: 如果只有一个缩略图且只有一个原始文件，直接匹配
        if (!matchingThumb && thumbnailFiles.length === 1 && originalFiles.length === 1) {
          matchingThumb = thumbnailFiles[0]
        }

        if (matchingThumb) {
          const thumbnailPath = `${donationPublicId}/.thumbnails/${matchingThumb.name}`
          const { data: { publicUrl: thumbUrl } } = supabase.storage
            .from('donation-results')
            .getPublicUrl(thumbnailPath)
          thumbnailUrl = thumbUrl
        }
      }

      // Determine file type from metadata or filename
      const isImage = file.metadata?.mimetype?.startsWith('image/') ||
                     /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name)
      const isVideo = file.metadata?.mimetype?.startsWith('video/') ||
                     /\.(mp4|mov)$/i.test(file.name)

      return {
        name: file.name,
        originalUrl: publicUrl,
        thumbnailUrl,
        isImage,
        isVideo,
        size: file.metadata?.size || 0,
        contentType: file.metadata?.mimetype || ''
      }
    })

    console.log('[getAllDonationResultFiles] Success! Files:', fileObjects.length)

    return {
      files: fileObjects,
      error: null
    }
  } catch (error) {
    console.error('[getAllDonationResultFiles] Error:', error)
    return {
      error: 'serverError',
      files: [],
      details: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
