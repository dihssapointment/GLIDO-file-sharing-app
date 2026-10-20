'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Info } from 'lucide-react'
import { createContext, useCallback, useContext, useRef, useState } from 'react'

type Toast = { id: number; message: string; tone: 'success' | 'info' }
type ToastContextValue = { toast: (message: string, tone?: Toast['tone']) => void }

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)

  const toast = useCallback((message: string, tone: Toast['tone'] = 'success') => {
    const id = nextId.current++
    setToasts((prev) => [...prev.slice(-2), { id, message, tone }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2400)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-50 flex flex-col items-center gap-2 px-4"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.9, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: 12, scale: 0.95, filter: 'blur(6px)' }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              className="glass flex items-center gap-2.5 rounded-full px-5 py-3 text-sm font-medium text-white"
            >
              {t.tone === 'success' ? (
                <CheckCircle2 className="size-4" aria-hidden="true" />
              ) : (
                <Info className="size-4" aria-hidden="true" />
              )}
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
