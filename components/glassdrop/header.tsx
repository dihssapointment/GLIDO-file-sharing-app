'use client'

import Link from 'next/link'
import { useSyncExternalStore } from 'react'
import { Droplet } from 'lucide-react'
import { cn } from '@/lib/utils'

function subscribe(callback: () => void) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

function useOnline() {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  )
}

export function Header() {
  const online = useOnline()

  return (
    <header className="sticky top-0 z-40 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="glass mx-auto flex max-w-xl items-center justify-between rounded-full px-4 py-2.5">
        <Link href="/" className="flex items-center gap-2.5" aria-label="FLUXO home">
          <span className="glass-subtle flex size-8 items-center justify-center rounded-full">
            <Droplet className="size-4 text-white" strokeWidth={2.25} aria-hidden="true" />
          </span>
          <span className="text-glow text-lg font-semibold tracking-[0.12em] text-white">
            FLUXO
          </span>
        </Link>

        <div
          className="glass-subtle flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium"
          role="status"
          aria-live="polite"
        >
          <span className="relative flex size-2">
            {online && (
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-white/70" />
            )}
            <span
              className={cn(
                'relative inline-flex size-2 rounded-full',
                online ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'bg-zinc-600',
              )}
            />
          </span>
          <span className={online ? 'text-white' : 'text-muted-foreground'}>
            {online ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>
    </header>
  )
}
