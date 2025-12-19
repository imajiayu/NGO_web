import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: { orderReference: string } }
) {
  const { orderReference } = params

  if (!orderReference) {
    return NextResponse.json(
      { error: 'Order reference is required' },
      { status: 400 }
    )
  }

  try {
    // Use Service Client to bypass RLS and avoid auth.users permission errors
    // Create a fresh client for each request to avoid caching issues
    const supabase = createServiceClient()

    console.log(`[API] Fetching donations for order: ${orderReference}`)

    // Fetch donations by order_reference with project details
    const { data: donations, error } = await supabase
      .from('donations')
      .select(`
        id,
        donation_public_id,
        amount,
        donor_email,
        donation_status,
        projects (
          id,
          project_name,
          project_name_i18n,
          location,
          location_i18n,
          unit_name,
          unit_name_i18n
        )
      `)
      .eq('order_reference', orderReference)
      .order('created_at', { ascending: true })

    console.log(`[API] Found ${donations?.length || 0} donations, statuses:`, donations?.map(d => d.donation_status).join(', '))

    if (error) {
      console.error('Error fetching donations:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ donations: donations || [] })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
