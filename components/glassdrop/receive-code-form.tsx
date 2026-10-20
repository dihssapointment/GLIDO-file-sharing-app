'use client'

import { motion, useAnimationControls } from 'framer-motion'
import { ArrowRight, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { fetchJson } from '@/lib/client'
import { GlassButton } from './glass'

const LENGTH = 6

export function ReceiveCodeForm() {
  const router = useRouter()
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(''))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const shake = useAnimationControls()

  const code = digits.join('')

  async function submit(value = code) {
    if (value.length !== LENGTH || busy) return
    setBusy(true)
    setError(null)
    try {
      const { id } = await fetchJson<{ id: string }>('/api/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: value }),
      })
      router.push(`/s/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code')
      shake.start({ x: [0, -10, 10, -6, 6, 0], transition: { duration: 0.4 } })
      setBusy(false)
    }
  }

  function fill(start: number, raw: string) {
    const chars = raw.replace(/\D/g, '').slice(0, LENGTH - start).split('')
    if (chars.length === 0) return
    const next = [...digits]
    chars.forEach((c, k) => (next[start + k] = c))
    setDigits(next)
    setError(null)
    const focusIndex = Math.min(start + chars.length, LENGTH - 1)
    refs.current[focusIndex]?.focus()
    const joined = next.join('')
    if (joined.length === LENGTH) submit(joined)
  }

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <div className="flex flex-col gap-1.5">
        <h1 className="text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Receive a drop
        </h1>
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
          Enter the 6-digit code shown on the sender&apos;s screen, or scan their QR code.
        </p>
      </div>

      <fieldset>
        <legend className="sr-only">6-digit access code</legend>
        <motion.div animate={shake} className="flex justify-between gap-2 sm:gap-3">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                refs.current[i] = el
              }}
              value={d}
              inputMode="numeric"
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              pattern="\d*"
              maxLength={LENGTH}
              aria-label={`Digit ${i + 1}`}
              disabled={busy}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                const value = e.target.value
                if (value === '') {
                  const next = [...digits]
                  next[i] = ''
                  setDigits(next)
                  return
                }
                fill(i, value)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Backspace' && !digits[i] && i > 0) {
                  refs.current[i - 1]?.focus()
                } else if (e.key === 'ArrowLeft' && i > 0) {
                  refs.current[i - 1]?.focus()
                } else if (e.key === 'ArrowRight' && i < LENGTH - 1) {
                  refs.current[i + 1]?.focus()
                }
              }}
              onPaste={(e) => {
                e.preventDefault()
                fill(0, e.clipboardData.getData('text'))
              }}
              className="glass-subtle h-14 w-full min-w-0 rounded-2xl text-center font-mono text-2xl font-semibold text-white caret-white transition-shadow focus:border-white/40 focus:shadow-[0_0_30px_-6px_rgba(255,255,255,0.4)] focus:outline-none disabled:opacity-50 sm:h-16 sm:text-3xl"
            />
          ))}
        </motion.div>
      </fieldset>

      {error && (
        <p role="alert" className="text-center text-sm text-white">
          {error}
        </p>
      )}

      <GlassButton
        type="submit"
        variant="primary"
        disabled={code.length !== LENGTH || busy}
        className="h-12 text-base"
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <ArrowRight className="size-4" aria-hidden="true" />
        )}
        {busy ? 'Unlocking…' : 'Unlock'}
      </GlassButton>
    </form>
  )
}
