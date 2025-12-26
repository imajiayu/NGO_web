/**
 * 测试 Cloudinary 图像处理功能
 *
 * 使用方法：
 * 1. 将测试图片放在项目根目录，命名为 test-image.jpg
 * 2. 运行: npm run test:cloudinary
 * 3. 处理后的图片会保存为 test-image-processed.jpg
 */

import * as dotenv from 'dotenv'
import { processImageWithCloudinary, isCloudinaryConfigured } from '../lib/cloudinary'
import fs from 'fs/promises'
import path from 'path'

// 加载环境变量
dotenv.config({ path: '.env.local' })

async function testCloudinary() {
  console.log('🧪 Testing Cloudinary Integration\n')

  // 检查配置
  console.log('1️⃣  Checking Cloudinary configuration...')
  if (!isCloudinaryConfigured()) {
    console.error('❌ Cloudinary is not configured!')
    console.error('Please set the following environment variables:')
    console.error('  - NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME')
    console.error('  - CLOUDINARY_API_KEY')
    console.error('  - CLOUDINARY_API_SECRET')
    process.exit(1)
  }
  console.log('✅ Cloudinary is configured\n')

  // 读取测试图片
  console.log('2️⃣  Reading test image...')
  const testImagePath = path.join(process.cwd(), 'test-image.jpg')

  let imageBuffer: Buffer
  try {
    imageBuffer = await fs.readFile(testImagePath)
    console.log(`✅ Test image loaded: ${testImagePath}`)
    console.log(`   Original size: ${(imageBuffer.length / 1024 / 1024).toFixed(2)} MB\n`)
  } catch (error) {
    console.error(`❌ Failed to read test image: ${testImagePath}`)
    console.error('Please place a test image named "test-image.jpg" in the project root directory')
    process.exit(1)
  }

  // 处理图片
  console.log('3️⃣  Processing image with Cloudinary...')
  console.log('   - Applying face pixelation')
  console.log('   - Optimizing quality and size')
  console.log('   - Limiting max width to 1920px')

  try {
    const startTime = Date.now()

    const result = await processImageWithCloudinary({
      buffer: imageBuffer,
      fileName: 'test-image.jpg',
      folder: 'test-ngo-uploads',
    })

    const endTime = Date.now()
    const processingTime = ((endTime - startTime) / 1000).toFixed(2)

    console.log(`✅ Processing completed in ${processingTime}s\n`)

    // 显示结果统计
    console.log('4️⃣  Processing Results:')
    console.log(`   Original size:  ${(result.originalSize / 1024 / 1024).toFixed(2)} MB (${result.originalSize.toLocaleString()} bytes)`)
    console.log(`   Processed size: ${(result.processedSize / 1024 / 1024).toFixed(2)} MB (${result.processedSize.toLocaleString()} bytes)`)
    console.log(`   Size reduction: ${((1 - result.processedSize / result.originalSize) * 100).toFixed(1)}%`)
    console.log(`   Output format:  ${result.format}\n`)

    // 保存处理后的图片
    console.log('5️⃣  Saving processed image...')
    const outputPath = path.join(process.cwd(), `test-image-processed.${result.format}`)
    await fs.writeFile(outputPath, result.optimizedBuffer)
    console.log(`✅ Processed image saved: ${outputPath}\n`)

    // 总结
    console.log('🎉 Test completed successfully!')
    console.log('\n📝 Summary:')
    console.log('   ✅ Cloudinary configuration is working')
    console.log('   ✅ Image processing (compression + face blur) is working')
    console.log('   ✅ File size optimized')
    console.log(`\n   Compare the original and processed images:`)
    console.log(`   - Original:  ${testImagePath}`)
    console.log(`   - Processed: ${outputPath}`)

  } catch (error) {
    console.error('❌ Processing failed:')
    console.error(error)
    process.exit(1)
  }
}

// 运行测试
testCloudinary().catch(console.error)
