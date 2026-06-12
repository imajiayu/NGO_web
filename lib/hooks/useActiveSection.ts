'use client'

import { useEffect, useRef, useState } from 'react'

const ANCHOR_OFFSET = 200

export function useActiveSection(sectionIds: string[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(null)
  const visibleMap = useRef<Map<string, IntersectionObserverEntry>>(new Map())

  // Stable key: re-init the observer only when the actual id list changes.
  // Section ids never contain '|' (convention: `pN-section-name`).
  const sectionIdsKey = sectionIds.join('|')

  useEffect(() => {
    if (sectionIds.length === 0) return

    const map = visibleMap.current
    map.clear()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            map.set(entry.target.id, entry)
          } else {
            map.delete(entry.target.id)
          }
        }

        // Pick the most recently scrolled-past section: among visible entries
        // whose top has crossed the anchor line (top <= ANCHOR_OFFSET), choose
        // the one with the largest top (closest to the anchor from above).
        // This avoids selecting a tall preceding section whose bottom still
        // intersects: with min-top selection, an earlier long section would
        // win because its top is the most negative.
        let chosen: string | null = null
        let chosenTop = -Infinity
        for (const [id, entry] of map) {
          const top = entry.boundingClientRect.top
          if (top <= ANCHOR_OFFSET && top > chosenTop) {
            chosenTop = top
            chosen = id
          }
        }

        // Fallback for page top: nothing has crossed the anchor yet — pick the
        // first visible section by document order using the smallest top.
        if (chosen === null) {
          let minTop = Infinity
          for (const [id, entry] of map) {
            const top = entry.boundingClientRect.top
            if (top < minTop) {
              minTop = top
              chosen = id
            }
          }
        }

        setActiveId(chosen)
      },
      {
        rootMargin: `-${ANCHOR_OFFSET}px 0px -40% 0px`,
        threshold: 0,
      }
    )

    for (const id of sectionIds) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }

    return () => {
      observer.disconnect()
      map.clear()
    }
  }, [sectionIdsKey]) // eslint-disable-line react-hooks/exhaustive-deps

  return activeId
}
