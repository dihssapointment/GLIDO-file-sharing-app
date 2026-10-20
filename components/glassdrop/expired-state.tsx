'use client'

import { motion } from 'framer-motion'
import { RotateCcw, ShieldCheck } from 'lucide-react'
import { GlassButton } from './glass'

export function ExpiredState({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="flex flex-col items-center gap-6 py-6 text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0, rotate: -10 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        className="glass relative flex size-20 items-center justify-center rounded-3xl"
      >
        <motion.span
          aria-hidden="true"
          className="absolute inset-0 rounded-3xl border border-white/30"
          animate={{ scale: [1, 1.35], opacity: [0.6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
        />
        <ShieldCheck className="size-9 text-white" aria-hidden="true" />
      </motion.div>

      <div className="flex flex-col gap-2">
        <h2 className="text-glow text-2xl font-semibold tracking-tight text-white">
          Session Expired.
        </h2>
        <p className="mx-auto max-w-xs text-pretty text-sm leading-relaxed text-muted-foreground">
          Content has been permanently purged for your privacy.
        </p>
      </div>

      <GlassButton variant="primary" onClick={onRestart} className="h-12 px-6 text-base">
        <RotateCcw className="size-4" aria-hidden="true" />
        Start New Session
      </GlassButton>
    </div>
  )
}
