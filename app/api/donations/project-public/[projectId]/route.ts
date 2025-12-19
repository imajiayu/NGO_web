import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * Secure Public API for Project Donations
 *
 * Security Features:
 * - Uses database view with email obfuscation
 * - Only returns safe fields for public display
 * - No sensitive donor information exposed
 */
export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  const { projectId } = params
  const projectIdNum = parseInt(projectId)

  if (!projectIdNum || isNaN(projectIdNum)) {
    return NextResponse.json(
      { error: 'Invalid project ID' },
      { status: 400 }
    )
  }

  try {
    // Use regular server client (RLS enforced)
    const supabase = createServerClient()

    // Fetch from secure view with obfuscated emails
    const { data: donations, error } = await supabase
      .from('public_project_donations')
      .select('*')
      .eq('project_id', projectIdNum)
      .order('donated_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching donations:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(donations || [])
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
