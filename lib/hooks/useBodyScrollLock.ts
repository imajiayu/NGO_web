'use client'

import { useEffect } from 'react'

/**
 * 锁定页面滚动的 Hook
 * 用于 Modal、BottomSheet 等需要阻止背景滚动的场景
 *
 * @param isLocked - 是否锁定，默认 true
 */
export function useBodyScrollLock(isLocked: boolean = true) {
  useEffect(() => {
    if (!isLocked) return

    const scrollY = window.scrollY
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'

    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      window.scrollTo(0, scrollY)
    }
  }, [isLocked])
}
