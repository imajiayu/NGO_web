import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// Disable Next.js caching for this API route
export const dynamic = 'force-dynamic'
export const revalidate = 0

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
    const supabase = createServiceClient()

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

    if (error) {
      console.error('Error fetching donations:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(
      { donations: donations || [] },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
