'use client'

import { useEffect, useEffectEvent, useState } from 'react'

/** Ticks toward `deadline` (epoch ms) and fires `onExpire` exactly once. */
export function useCountdown(deadline: number | null, onExpire?: () => void) {
  const [now, setNow] = useState(() => Date.now())
  const fireExpire = useEffectEvent(() => onExpire?.())

  useEffect(() => {
    if (deadline === null) return
    let fired = false
    const tick = () => {
      const current = Date.now()
      setNow(current)
      if (!fired && current >= deadline) {
        fired = true
        fireExpire()
      }
    }
    tick()
    const interval = setInterval(tick, 250)
    return () => clearInterval(interval)
  }, [deadline])

  return deadline === null ? 0 : Math.max(0, deadline - now)
}
