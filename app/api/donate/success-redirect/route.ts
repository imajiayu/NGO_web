import { NextRequest, NextResponse } from 'next/server'

/**
 * API route to handle redirects from WayForPay
 *
 * WayForPay can redirect users via either GET or POST after payment completion.
 * This endpoint extracts the order reference and redirects to the actual success page.
 *
 * Flow:
 * 1. WayForPay redirects user → /api/donate/success-redirect (GET or POST)
 * 2. Extract order reference from query params or form data
 * 3. Redirect to /{locale}/donate/success?order={orderReference} (GET)
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)

    // Extract order reference from query parameters
    const orderReference =
      url.searchParams.get('orderReference') ||
      url.searchParams.get('order')

    // Extract locale from query params or default to 'en'
    const locale = url.searchParams.get('locale') || 'en'

    console.log('[Success Redirect] GET received:', {
      orderReference,
      locale,
      queryParams: Object.fromEntries(url.searchParams),
    })

    if (!orderReference) {
      console.error('[Success Redirect] No order reference found in GET')
      // Redirect to success page without order
      return NextResponse.redirect(
        new URL(`/${locale}/donate/success`, request.url)
      )
    }

    // Build success page URL with order reference
    const successUrl = new URL(`/${locale}/donate/success`, request.url)
    successUrl.searchParams.set('order', orderReference)

    console.log('[Success Redirect] GET redirecting to:', successUrl.toString())

    return NextResponse.redirect(successUrl, 303)
  } catch (error) {
    console.error('[Success Redirect] Error handling GET:', error)

    // Fallback to success page without parameters
    return NextResponse.redirect(
      new URL('/en/donate/success', request.url),
      303
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const url = new URL(request.url)

    // Extract order reference from multiple possible sources
    const orderReference =
      (formData.get('orderReference') as string) ||
      (formData.get('order') as string) ||
      url.searchParams.get('order') ||
      url.searchParams.get('orderReference')

    // Extract locale from query params or default to 'en'
    const locale =
      url.searchParams.get('locale') ||
      (formData.get('locale') as string) ||
      'en'

    console.log('[Success Redirect] POST received:', {
      orderReference,
      locale,
      formDataKeys: Array.from(formData.keys()),
      queryParams: Object.fromEntries(url.searchParams),
    })

    if (!orderReference) {
      console.error('[Success Redirect] No order reference found')
      // Redirect to success page without order
      return NextResponse.redirect(
        new URL(`/${locale}/donate/success`, request.url)
      )
    }

    // Build success page URL with order reference
    const successUrl = new URL(`/${locale}/donate/success`, request.url)
    successUrl.searchParams.set('order', orderReference)

    console.log('[Success Redirect] Redirecting to:', successUrl.toString())

    return NextResponse.redirect(successUrl, 303) // 303 See Other for POST->GET redirect
  } catch (error) {
    console.error('[Success Redirect] Error handling POST:', error)

    // Fallback to success page without parameters
    return NextResponse.redirect(
      new URL('/en/donate/success', request.url),
      303
    )
  }
}
