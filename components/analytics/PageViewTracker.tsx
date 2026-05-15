'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

import { type PageType, trackEvent } from '@/lib/analytics/track'

interface PageViewTrackerProps {
  pageType: PageType
  entityId?: number | null
  /** Pass `locale` from page props — string is accepted, unknown values fall back to 'en' */
  locale: string
}

function narrowLocale(value: string): 'en' | 'zh' | 'ua' {
  return value === 'zh' || value === 'ua' ? value : 'en'
}

/**
 * Invisible analytics component — renders nothing, has no DOM footprint.
 * Fires a `view` event in useEffect when pathname / pageType / entityId changes.
 */
export default function PageViewTracker({ pageType, entityId, locale }: PageViewTrackerProps) {
  const pathname = usePathname()

  useEffect(() => {
    trackEvent({
      event_type: 'view',
      page_type: pageType,
      entity_id: entityId ?? null,
      path: pathname,
      locale: narrowLocale(locale),
    })
  }, [pathname, pageType, entityId, locale])

  return null
}
