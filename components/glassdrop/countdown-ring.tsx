'use client'

import { motion } from 'framer-motion'
import { formatClock } from '@/lib/client'
import { cn } from '@/lib/utils'

const TOTAL_MS = 120_000

export function CountdownRing({
  remainingMs,
  size = 168,
  className,
}: {
  remainingMs: number
  size?: number
  className?: string
}) {
  const stroke = 6
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(1, Math.max(0, remainingMs / TOTAL_MS))
  const critical = remainingMs <= 15_000

  return (
    <div
      className={cn('relative flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      role="timer"
      aria-label={`Session expires in ${formatClock(remainingMs)}`}
    >
      <div className="glass-subtle absolute inset-3 rounded-full" aria-hidden="true" />
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="white"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: circumference * (1 - progress) }}
          transition={{ ease: 'linear', duration: 0.25 }}
          style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.55))' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <motion.span
          className="text-glow font-mono text-4xl font-semibold tabular-nums tracking-tight text-white"
          animate={critical ? { opacity: [1, 0.45, 1] } : { opacity: 1 }}
          transition={critical ? { duration: 1, repeat: Infinity } : undefined}
        >
          {formatClock(remainingMs)}
        </motion.span>
        <span className="mt-1 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          remaining
        </span>
      </div>
    </div>
  )
}
