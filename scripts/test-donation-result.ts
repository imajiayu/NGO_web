/**
 * Test script to debug donation result image issues
 * Run with: npx tsx scripts/test-donation-result.ts
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const DONATION_ID = '2-055A09' // Replace with your actual donation ID

async function testDonationResult() {
  console.log('🔍 Testing donation result for:', DONATION_ID)
  console.log('─'.repeat(60))

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Step 1: Check if donation exists
  console.log('\n1️⃣ Checking if donation exists...')
  const { data: donation, error: donationError } = await supabase
    .from('donations')
    .select('*')
    .eq('donation_public_id', DONATION_ID)
    .single()

  if (donationError || !donation) {
    console.error('❌ Donation not found:', donationError)
    return
  }

  console.log('✅ Donation found:')
  console.log('   - ID:', donation.donation_public_id)
  console.log('   - Status:', donation.donation_status)
  console.log('   - Project ID:', donation.project_id)
  console.log('   - Amount:', donation.amount, donation.currency)

  // Step 2: Check donation status
  console.log('\n2️⃣ Checking donation status...')
  if (donation.donation_status !== 'completed') {
    console.log(`⚠️  Status is "${donation.donation_status}", not "completed"`)
    console.log('   To fix: Run this SQL in Supabase SQL Editor:')
    console.log(`   UPDATE donations SET donation_status = 'completed' WHERE donation_public_id = '${DONATION_ID}';`)
  } else {
    console.log('✅ Status is "completed"')
  }

  // Step 3: Check storage bucket
  console.log('\n3️⃣ Checking storage bucket...')
  const { data: buckets, error: bucketsError } = await supabase
    .storage
    .listBuckets()

  if (bucketsError) {
    console.error('❌ Error listing buckets:', bucketsError)
    return
  }

  const donationBucket = buckets.find(b => b.name === 'donation-results')
  if (!donationBucket) {
    console.error('❌ "donation-results" bucket not found')
    console.log('   Available buckets:', buckets.map(b => b.name).join(', '))
    return
  }

  console.log('✅ Bucket "donation-results" exists')
  console.log('   - Public:', donationBucket.public)
  console.log('   - ID:', donationBucket.id)

  // Step 4: List files in donation folder
  console.log('\n4️⃣ Checking files in folder:', DONATION_ID)
  const { data: files, error: filesError } = await supabase
    .storage
    .from('donation-results')
    .list(DONATION_ID)

  if (filesError) {
    console.error('❌ Error listing files:', filesError)
    console.log('   This might mean the folder does not exist or RLS is blocking')
    return
  }

  if (!files || files.length === 0) {
    console.log('⚠️  No files found in folder:', DONATION_ID)
    console.log('   Make sure you uploaded the image to:')
    console.log(`   donation-results/${DONATION_ID}/your-image.jpg`)
    return
  }

  console.log('✅ Files found:', files.length)
  files.forEach((file, index) => {
    console.log(`   ${index + 1}. ${file.name} (${(file.metadata?.size || 0) / 1024} KB)`)
  })

  // Step 5: Get public URL
  console.log('\n5️⃣ Getting public URL...')
  const filePath = `${DONATION_ID}/${files[0].name}`
  const { data: urlData } = supabase
    .storage
    .from('donation-results')
    .getPublicUrl(filePath)

  if (!urlData || !urlData.publicUrl) {
    console.error('❌ Failed to get public URL')
    return
  }

  console.log('✅ Public URL generated:')
  console.log('  ', urlData.publicUrl)

  // Step 6: Test URL accessibility
  console.log('\n6️⃣ Testing URL accessibility...')
  try {
    const response = await fetch(urlData.publicUrl, { method: 'HEAD' })
    if (response.ok) {
      console.log('✅ Image is accessible!')
      console.log('   - Status:', response.status)
      console.log('   - Content-Type:', response.headers.get('content-type'))
    } else {
      console.log('❌ Image is NOT accessible')
      console.log('   - Status:', response.status)
      console.log('   - This might be an RLS policy issue')
    }
  } catch (error) {
    console.error('❌ Network error:', error)
  }

  console.log('\n' + '─'.repeat(60))
  console.log('✨ Test complete!')
}

// Run the test
testDonationResult().catch(console.error)
