/**
 * Cloudinary 图像处理工具
 * 功能：
 * 1. 压缩图片到合适大小（保持高质量）
 * 2. 人脸检测和打码
 */

import { v2 as cloudinary } from 'cloudinary'

// 确保 Cloudinary 配置（延迟配置，确保环境变量已加载）
function ensureCloudinaryConfig() {
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  })
}

/**
 * 带重试机制的 fetch 函数
 * 用于处理 Cloudinary 转换延迟和网络不稳定问题
 */
interface FetchRetryOptions {
  maxRetries: number
  initialDelay: number
  backoffMultiplier: number
  timeout?: number
}

async function fetchWithRetry(
  url: string,
  options: FetchRetryOptions
): Promise<Buffer> {
  const { maxRetries, initialDelay, backoffMultiplier, timeout = 30000 } = options
  let lastError: Error | null = null
  let currentDelay = initialDelay

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `[Cloudinary] Fetching transformed image (attempt ${attempt + 1}/${maxRetries + 1})...`
      )

      // 创建带超时的 fetch
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(url, {
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}: ${response.statusText}`
        )
      }

      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // 获取并存储 Content-Type 用于后续使用
      const contentType = response.headers.get('content-type') || 'image/jpeg'
      // @ts-ignore - 临时存储 contentType
      buffer._contentType = contentType

      console.log(
        `[Cloudinary] Successfully fetched transformed image (${buffer.length} bytes)`
      )

      return buffer
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.warn(
        `[Cloudinary] Fetch attempt ${attempt + 1} failed: ${lastError.message}`
      )

      // 如果还有重试机会，等待后重试
      if (attempt < maxRetries) {
        console.log(`[Cloudinary] Retrying in ${currentDelay}ms...`)
        await new Promise((resolve) => setTimeout(resolve, currentDelay))
        currentDelay *= backoffMultiplier
      }
    }
  }

  throw new Error(
    `Failed to fetch transformed image after ${maxRetries + 1} attempts: ${lastError?.message || 'Unknown error'}`
  )
}

interface ProcessImageOptions {
  buffer: Buffer
  fileName: string
  folder?: string
}

interface ProcessedImage {
  optimizedBuffer: Buffer
  originalSize: number
  processedSize: number
  format: string
}

/**
 * 处理图片：压缩 + 人脸打码
 *
 * 流程：
 * 1. 上传原图到 Cloudinary
 * 2. 应用转换：
 *    - 人脸打码（pixelate_faces）
 *    - 智能质量压缩（q_auto:good - 保持高质量）
 *    - 自动格式选择（f_auto - 自动选择最优格式）
 *    - 尺寸限制（最大 1920px 宽，保持宽高比）
 * 3. 下载处理后的图片
 * 4. 删除 Cloudinary 临时文件
 */
export async function processImageWithCloudinary(
  options: ProcessImageOptions
): Promise<ProcessedImage> {
  const { buffer, fileName, folder = 'temp-ngo-donations' } = options

  // 确保 Cloudinary 已配置
  ensureCloudinaryConfig()

  const originalSize = buffer.length

  try {
    // 步骤 1: 上传到 Cloudinary（临时存储）
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          public_id: `${Date.now()}-${fileName.replace(/\.[^/.]+$/, '')}`, // 移除扩展名
          // 不在上传时应用转换，稍后通过 URL 转换获取
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )
      uploadStream.end(buffer)
    })

    console.log(`[Cloudinary] Uploaded: ${uploadResult.public_id} (${uploadResult.bytes} bytes)`)

    // 步骤 2: 生成转换后的图片 URL
    const transformedUrl = cloudinary.url(uploadResult.public_id, {
      transformation: [
        {
          // 人脸打码（马赛克效果）
          effect: 'pixelate_faces:20', // 20px 像素化强度
        },
        {
          // 尺寸限制：最大宽度 1920px，保持宽高比
          width: 1920,
          crop: 'limit', // 只在超过时缩小，不放大
        },
        {
          // 质量优化
          quality: 'auto:good', // 自动质量，偏向高质量（范围 auto:low, auto:good, auto:best）
          fetch_format: 'auto', // 自动选择最优格式（WebP for modern browsers, JPEG fallback）
          flags: 'lossy', // 允许有损压缩以减小文件大小
        },
      ],
    })

    console.log(`[Cloudinary] Transform URL: ${transformedUrl}`)

    // 步骤 3: 下载转换后的图片（带重试机制）
    // Cloudinary 的 AI 转换（如人脸检测）需要时间，所以添加重试
    const optimizedBuffer = await fetchWithRetry(transformedUrl, {
      maxRetries: 3,
      initialDelay: 1000, // 首次重试前等待 1 秒
      backoffMultiplier: 2, // 每次重试延迟翻倍
    })
    const processedSize = optimizedBuffer.length

    console.log(
      `[Cloudinary] Processed: ${originalSize} bytes → ${processedSize} bytes ` +
        `(${((1 - processedSize / originalSize) * 100).toFixed(1)}% reduction)`
    )

    // 步骤 4: 删除 Cloudinary 临时文件（清理）
    try {
      await cloudinary.uploader.destroy(uploadResult.public_id)
      console.log(`[Cloudinary] Deleted temp file: ${uploadResult.public_id}`)
    } catch (cleanupError) {
      // 清理失败不影响主流程
      console.warn(`[Cloudinary] Failed to delete temp file:`, cleanupError)
    }

    // 从存储的 Content-Type 中提取格式
    // Cloudinary 的 f_auto 会自动选择格式（WebP for modern browsers, JPEG fallback）
    // @ts-ignore - 从之前存储的 contentType 中提取
    const contentType = (optimizedBuffer as any)._contentType || 'image/jpeg'
    const format = contentType.split('/')[1]?.split(';')[0] || 'jpg'

    return {
      optimizedBuffer,
      originalSize,
      processedSize,
      format,
    }
  } catch (error) {
    console.error('[Cloudinary] Processing failed:', error)
    console.warn('[Cloudinary] Falling back to direct compression without face detection')

    // 降级策略：使用 sharp 进行简单压缩（无人脸检测）
    try {
      const sharp = require('sharp')

      const compressed = await sharp(buffer)
        .resize(1920, undefined, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 85 }) // 高质量 JPEG
        .toBuffer()

      console.log(
        `[Cloudinary] Fallback compression successful: ${originalSize} bytes → ${compressed.length} bytes ` +
          `(${((1 - compressed.length / originalSize) * 100).toFixed(1)}% reduction)`
      )

      return {
        optimizedBuffer: compressed,
        originalSize,
        processedSize: compressed.length,
        format: 'jpg',
      }
    } catch (fallbackError) {
      console.error('[Cloudinary] Fallback compression also failed:', fallbackError)
      // 最后的降级：返回原图
      console.warn('[Cloudinary] Using original image without processing')
      return {
        optimizedBuffer: buffer,
        originalSize,
        processedSize: originalSize,
        format: fileName.split('.').pop() || 'jpg',
      }
    }
  }
}

/**
 * 检查 Cloudinary 配置是否正确
 */
export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  )
}

/**
 * 批量处理图片
 */
export async function processMultipleImages(
  images: ProcessImageOptions[]
): Promise<ProcessedImage[]> {
  const results: ProcessedImage[] = []

  for (const imageOptions of images) {
    const processed = await processImageWithCloudinary(imageOptions)
    results.push(processed)
  }

  return results
}
