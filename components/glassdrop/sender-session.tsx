'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Check, Copy, Eye, Link2, Loader2, Square } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'
import useSWR from 'swr'
import { useCountdown } from '@/hooks/use-countdown'
import { fetchJson, HttpError } from '@/lib/client'
import type { CreatedSession, SessionStatus } from '@/lib/types'
import { CountdownRing } from './countdown-ring'
import { GlassButton } from './glass'
import { useToast } from './toast'

export function SenderSession({
  session,
  deadline,
  onExpired,
}: {
  session: CreatedSession
  deadline: number
  onExpired: () => void
}) {
  const { toast } = useToast()
  const [ending, setEnding] = useState(false)
  const shareUrl = `${window.location.origin}/s/${session.id}`

  const remaining = useCountdown(deadline, () => {
    fetch('/api/purge', { method: 'POST' }).catch(() => {})
    onExpired()
  })

  const { data: status } = useSWR<SessionStatus>(
    `/api/sessions/${session.id}/status`,
    (url: string) => fetchJson<SessionStatus>(url, { headers: { 'x-owner-token': session.ownerToken } }),
    {
      refreshInterval: 2000,
      onError: (err) => {
        if (err instanceof HttpError && err.status === 410) onExpired()
      },
    },
  )

  async function copy(value: string, label: string) {
    await navigator.clipboard.writeText(value)
    toast(`${label} copied to clipboard!`)
  }

  async function endNow() {
    setEnding(true)
    try {
      await fetch(`/api/sessions/${session.id}`, {
        method: 'DELETE',
        headers: { 'x-owner-token': session.ownerToken },
      })
    } finally {
      onExpired()
    }
  }

  const received = status?.received ?? false

  return (
    <div className="flex flex-col items-center gap-6">
      <CountdownRing remainingMs={remaining} />

      <div className="flex w-full flex-col items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Access code
        </span>
        <button
          type="button"
          onClick={() => copy(session.code, 'Code')}
          className="glass group flex items-center gap-1.5 rounded-3xl px-4 py-3 transition-shadow hover:shadow-[0_0_40px_-8px_rgba(255,255,255,0.4)] sm:gap-2 sm:px-5"
          aria-label={`Access code ${session.code.split('').join(' ')}. Tap to copy.`}
        >
          {session.code.split('').map((digit, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ delay: 0.05 * i, type: 'spring', stiffness: 400, damping: 26 }}
              className="text-glow flex h-12 w-9 items-center justify-center rounded-xl bg-white/[0.06] font-mono text-3xl font-semibold text-white sm:h-14 sm:w-11 sm:text-4xl"
            >
              {digit}
            </motion.span>
          ))}
          <Copy
            className="ml-1 size-4 text-muted-foreground transition-colors group-hover:text-white"
            aria-hidden="true"
          />
        </button>
      </div>

      <div className="flex w-full flex-col items-center gap-4 sm:flex-row sm:items-stretch">
        <div className="rounded-3xl bg-white p-3 shadow-[0_0_50px_-10px_rgba(255,255,255,0.45)]">
          <QRCodeSVG
            value={shareUrl}
            size={148}
            bgColor="#ffffff"
            fgColor="#000000"
            level="M"
            title="QR code linking to this share"
          />
        </div>

        <div className="flex w-full flex-1 flex-col justify-between gap-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={received ? 'received' : 'waiting'}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="glass-subtle flex items-center gap-3 rounded-2xl px-4 py-3"
              role="status"
              aria-live="polite"
            >
              {received ? (
                <>
                  <span className="flex size-8 items-center justify-center rounded-full bg-white text-black">
                    <Eye className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">Receiver connected</p>
                    <p className="text-xs text-muted-foreground">Your content was opened.</p>
                  </div>
                </>
              ) : (
                <>
                  <span className="relative flex size-8 items-center justify-center rounded-full bg-white/[0.08]">
                    <Loader2 className="size-4 animate-spin text-white" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">Waiting for receiver…</p>
                    <p className="text-xs text-muted-foreground">Scan the QR or enter the code.</p>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          <GlassButton onClick={() => copy(shareUrl, 'Link')} className="w-full">
            <Link2 className="size-4" aria-hidden="true" />
            Copy direct link
          </GlassButton>
          <GlassButton onClick={endNow} disabled={ending} className="w-full text-muted-foreground">
            {ending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Square className="size-3.5 fill-current" aria-hidden="true" />
            )}
            End & purge now
          </GlassButton>
        </div>
      </div>

      <p className="flex items-center gap-1.5 text-center text-xs text-muted-foreground">
        <Check className="size-3.5" aria-hidden="true" />
        Encrypted in transit · auto-deleted at 00:00
      </p>
    </div>
  )
}
