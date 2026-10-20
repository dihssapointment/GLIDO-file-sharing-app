'use client'

import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { useId } from 'react'
import { cn } from '@/lib/utils'

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string; icon?: LucideIcon }[]
  label: string
  className?: string
}) {
  const layoutId = useId()
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn('glass-subtle flex rounded-2xl p-1', className)}
    >
      {options.map((opt) => {
        const active = opt.value === value
        const Icon = opt.icon
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
              active ? 'text-black' : 'text-muted-foreground hover:text-white',
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-xl bg-white shadow-[0_4px_20px_-4px_rgba(255,255,255,0.45)]"
                transition={{ type: 'spring', stiffness: 450, damping: 34 }}
              />
            )}
            {Icon && <Icon className="relative size-4" aria-hidden="true" />}
            <span className="relative">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}
