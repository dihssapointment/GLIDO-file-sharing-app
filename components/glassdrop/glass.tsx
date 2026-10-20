'use client'

import { motion, type HTMLMotionProps } from 'framer-motion'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export function GlassPanel({ className, ...props }: HTMLMotionProps<'section'>) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16, scale: 0.98, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -12, scale: 0.98, filter: 'blur(10px)' }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      className={cn('glass glass-sheen rounded-3xl p-5 sm:p-7', className)}
      {...props}
    />
  )
}

type GlassButtonProps = HTMLMotionProps<'button'> & {
  variant?: 'primary' | 'ghost'
}

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant = 'ghost', disabled, ...props }, ref) => (
    <motion.button
      ref={ref}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold transition-[box-shadow,background-color,opacity] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-not-allowed disabled:opacity-40',
        variant === 'primary'
          ? 'bg-white text-black shadow-[0_0_0_1px_rgba(255,255,255,0.4),0_8px_30px_-6px_rgba(255,255,255,0.35)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.6),0_10px_40px_-4px_rgba(255,255,255,0.5)]'
          : 'glass-subtle text-white hover:bg-white/[0.09] hover:shadow-[0_0_24px_-6px_rgba(255,255,255,0.35)]',
        className,
      )}
      {...props}
    />
  ),
)
GlassButton.displayName = 'GlassButton'
