import { useEffect, useState } from 'react'

/** Tracks the md breakpoint (768px) reactively, so rotating a phone updates layout decisions. */
export function useIsDesktop(): boolean {
  const query = '(min-width: 768px)'
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setIsDesktop(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return isDesktop
}
