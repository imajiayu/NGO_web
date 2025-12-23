'use server'

import { createAuthClient, requireAdmin } from '@/lib/supabase/admin-auth'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database'
import sharp from 'sharp'

type Project = Database['public']['Tables']['projects']['Row']
type ProjectUpdate = Database['public']['Tables']['projects']['Update']
type ProjectInsert = Database['public']['Tables']['projects']['Insert']
type Donation = Database['public']['Tables']['donations']['Row']

/**
 * 管理员登录
 */
export async function adminLogin(email: string, password: string) {
  const supabase = await createAuthClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, user: data.user }
}

/**
 * 管理员登出
 */
export async function adminLogout() {
  const supabase = await createAuthClient()
  await supabase.auth.signOut()
  return { success: true }
}

/**
 * 获取所有项目（管理员视图）
 */
export async function getAdminProjects() {
  await requireAdmin()
  const supabase = await createAuthClient()

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Project[]
}

/**
 * 创建项目
 */
export async function createProject(project: ProjectInsert) {
  await requireAdmin()
  const supabase = await createAuthClient()

  const { data, error } = await supabase
    .from('projects')
    .insert(project)
    .select()
    .single()

  if (error) throw error

  revalidatePath('/admin/projects')
  revalidatePath('/[locale]', 'page')
  return data as Project
}

/**
 * 更新项目
 */
export async function updateProject(id: number, updates: ProjectUpdate) {
  await requireAdmin()
  const supabase = await createAuthClient()

  // 确保不修改这些字段
  const { id: _, created_at, updated_at, ...safeUpdates } = updates as any

  const { data, error } = await supabase
    .from('projects')
    .update(safeUpdates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  revalidatePath('/admin/projects')
  revalidatePath('/[locale]', 'page')
  return data as Project
}

/**
 * 获取所有捐赠（管理员视图）
 * 排序规则：
 * 1. failed 状态排在最后
 * 2. 其他状态按 donated_at 降序排序
 */
export async function getAdminDonations() {
  await requireAdmin()
  const supabase = await createAuthClient()

  const { data, error } = await supabase
    .from('donations')
    .select(`
      *,
      projects (
        project_name,
        project_name_i18n
      )
    `)

  if (error) throw error

  // 自定义排序：failed 状态排在最后，其他按 donated_at 降序
  const sorted = (data || []).sort((a, b) => {
    // 首先按状态排序：failed 排在最后
    if (a.donation_status === 'failed' && b.donation_status !== 'failed') return 1
    if (a.donation_status !== 'failed' && b.donation_status === 'failed') return -1

    // 如果状态相同（都是 failed 或都不是 failed），按 donated_at 降序排序
    const dateA = new Date(a.donated_at).getTime()
    const dateB = new Date(b.donated_at).getTime()
    return dateB - dateA
  })

  return sorted as (Donation & { projects: { project_name: string; project_name_i18n: any } })[]
}

/**
 * 更新捐赠状态
 */
export async function updateDonationStatus(
  id: number,
  newStatus: string
) {
  await requireAdmin()
  const supabase = await createAuthClient()

  // 获取当前捐赠记录（包含 donation_public_id 用于验证文件）
  const { data: current, error: fetchError } = await supabase
    .from('donations')
    .select('donation_status, donation_public_id')
    .eq('id', id)
    .single()

  if (fetchError) throw fetchError

  // 验证状态转换
  const validTransitions: Record<string, string[]> = {
    refunding: ['refunded'],
    paid: ['confirmed'],
    confirmed: ['delivering'],
    delivering: ['completed'],
  }

  const currentStatus = current.donation_status || ''
  const allowedNext = validTransitions[currentStatus] || []

  if (!allowedNext.includes(newStatus)) {
    throw new Error(
      `Invalid status transition: ${currentStatus} → ${newStatus}`
    )
  }

  // 如果是 delivering → completed，验证文件是否已上传
  if (currentStatus === 'delivering' && newStatus === 'completed') {
    const { data: files } = await supabase.storage
      .from('donation-results')
      .list(current.donation_public_id, { limit: 1 })

    if (!files || files.length === 0) {
      throw new Error('Please upload a result image/video before marking as completed')
    }
  }

  // 更新状态
  const { data, error } = await supabase
    .from('donations')
    .update({ donation_status: newStatus })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  revalidatePath('/admin/donations')
  return data as Donation
}

/**
 * 上传捐赠结果文件（通过 FormData）
 * 文件存储在 donation-results/{donation_public_id}/{filename}
 */
export async function uploadDonationResultFile(formData: FormData) {
  await requireAdmin()
  const supabase = await createAuthClient()

  const donationIdStr = formData.get('donationId') as string
  const file = formData.get('file') as File

  if (!file || !donationIdStr) {
    throw new Error('Missing file or donation ID')
  }

  const donationId = parseInt(donationIdStr, 10)
  if (isNaN(donationId)) {
    throw new Error('Invalid donation ID')
  }

  // 获取捐赠的 donation_public_id
  const { data: donation, error: donationError } = await supabase
    .from('donations')
    .select('donation_public_id')
    .eq('id', donationId)
    .single()

  if (donationError || !donation) {
    throw new Error('Donation not found')
  }

  // 验证文件类型
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime']
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type')
  }

  // 验证文件大小（最大 50MB）
  if (file.size > 50 * 1024 * 1024) {
    throw new Error('File too large (max 50MB)')
  }

  // 生成文件路径：{donation_public_id}/{timestamp}.{ext}
  const timestamp = Date.now()
  const fileExt = file.name.split('.').pop()
  const fileName = `${timestamp}.${fileExt}`
  const filePath = `${donation.donation_public_id}/${fileName}`

  // 读取文件内容
  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  // 上传原始文件（使用管理员认证的 client）
  const { error: uploadError } = await supabase.storage
    .from('donation-results')
    .upload(filePath, buffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`)
  }

  // 如果是图片，生成并上传缩略图
  const isImage = file.type.startsWith('image/')
  if (isImage) {
    try {
      // 使用 Sharp 生成缩略图（300px 宽，保持宽高比）
      const thumbnailBuffer = await sharp(buffer)
        .resize(300, null, {
          withoutEnlargement: true,
          fit: 'inside'
        })
        .jpeg({ quality: 80 })
        .toBuffer()

      // 缩略图文件路径 - 使用相同的时间戳
      const thumbnailFileName = `${timestamp}_thumb.jpg`
      const thumbnailPath = `${donation.donation_public_id}/.thumbnails/${thumbnailFileName}`

      // 上传缩略图
      await supabase.storage
        .from('donation-results')
        .upload(thumbnailPath, thumbnailBuffer, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false,
        })
    } catch (thumbnailError) {
      // 缩略图生成失败不影响主流程，只记录错误
      console.error('Failed to generate thumbnail:', thumbnailError)
    }
  }

  // 获取公开 URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('donation-results').getPublicUrl(filePath)

  return {
    publicUrl,
    filePath,
    donationPublicId: donation.donation_public_id
  }
}

/**
 * 获取捐赠的所有结果文件
 */
export async function getDonationResultFiles(donationId: number) {
  await requireAdmin()
  const supabase = await createAuthClient()

  // 获取捐赠的 donation_public_id
  const { data: donation, error: donationError } = await supabase
    .from('donations')
    .select('donation_public_id')
    .eq('id', donationId)
    .single()

  if (donationError || !donation) {
    throw new Error('Donation not found')
  }

  // 列出文件夹中的所有文件
  const { data: files, error: listError } = await supabase.storage
    .from('donation-results')
    .list(donation.donation_public_id, {
      sortBy: { column: 'created_at', order: 'desc' }
    })

  if (listError) {
    throw new Error(`Failed to list files: ${listError.message}`)
  }

  // 为每个文件生成公开 URL
  const filesWithUrls = (files || []).map(file => {
    const filePath = `${donation.donation_public_id}/${file.name}`
    const { data: { publicUrl } } = supabase.storage
      .from('donation-results')
      .getPublicUrl(filePath)

    return {
      name: file.name,
      path: filePath,
      publicUrl,
      size: file.metadata?.size || 0,
      contentType: file.metadata?.mimetype || '',
      createdAt: file.created_at,
      updatedAt: file.updated_at
    }
  })

  return filesWithUrls
}

/**
 * 删除捐赠结果文件
 */
export async function deleteDonationResultFile(donationId: number, filePath: string) {
  await requireAdmin()
  const supabase = await createAuthClient()

  // 获取捐赠的 donation_public_id 以验证文件路径
  const { data: donation, error: donationError } = await supabase
    .from('donations')
    .select('donation_public_id')
    .eq('id', donationId)
    .single()

  if (donationError || !donation) {
    throw new Error('Donation not found')
  }

  // 验证文件路径是否属于该捐赠
  if (!filePath.startsWith(`${donation.donation_public_id}/`)) {
    throw new Error('Invalid file path')
  }

  // 删除文件
  const { error: deleteError } = await supabase.storage
    .from('donation-results')
    .remove([filePath])

  if (deleteError) {
    throw new Error(`Failed to delete file: ${deleteError.message}`)
  }

  return { success: true }
}

