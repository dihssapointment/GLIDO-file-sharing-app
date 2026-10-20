'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { UploadCloud, X } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { formatBytes } from '@/lib/client'
import { MAX_FILE_BYTES, MAX_FILES } from '@/lib/types'
import { cn } from '@/lib/utils'
import { FileGlyph } from './file-glyph'

export function Dropzone({
  files,
  onChange,
  disabled,
  progress,
  onReject,
}: {
  files: File[]
  onChange: (files: File[]) => void
  disabled?: boolean
  progress?: Record<number, number>
  onReject: (message: string) => void
}) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return
    const accepted: File[] = []
    for (const file of Array.from(incoming)) {
      if (file.size > MAX_FILE_BYTES) {
        onReject(`${file.name} exceeds ${formatBytes(MAX_FILE_BYTES)}`)
        continue
      }
      accepted.push(file)
    }
    const next = [...files, ...accepted]
    if (next.length > MAX_FILES) onReject(`Up to ${MAX_FILES} files per session`)
    onChange(next.slice(0, MAX_FILES))
  }

  return (
    <div className="flex flex-col gap-3">
      <motion.label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          if (!disabled) addFiles(e.dataTransfer.files)
        }}
        animate={{ scale: dragging ? 1.015 : 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className={cn(
          'group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border border-dashed px-6 py-10 text-center transition-colors',
          dragging
            ? 'border-white/60 bg-white/[0.08] shadow-[0_0_40px_-8px_rgba(255,255,255,0.35)]'
            : 'border-white/15 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.04]',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        <motion.span
          animate={{ y: dragging ? -4 : 0 }}
          className="glass-subtle flex size-14 items-center justify-center rounded-2xl transition-shadow group-hover:shadow-[0_0_30px_-4px_rgba(255,255,255,0.35)]"
        >
          <UploadCloud className="size-6 text-white" aria-hidden="true" />
        </motion.span>
        <span className="flex flex-col gap-1">
          <span className="text-base font-medium text-white">
            {dragging ? 'Release to add' : 'Drop files here or tap to browse'}
          </span>
          <span className="text-sm text-muted-foreground">
            Photos, PDFs, documents, media · up to {formatBytes(MAX_FILE_BYTES)} each
          </span>
        </span>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          multiple
          className="sr-only"
          disabled={disabled}
          onChange={(e) => {
            addFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </motion.label>

      <ul className="flex flex-col gap-2" aria-label="Selected files">
        <AnimatePresence initial={false}>
          {files.map((file, i) => {
            const pct = progress?.[i]
            return (
              <motion.li
                key={`${file.name}-${file.size}-${file.lastModified}`}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="glass-subtle relative flex items-center gap-3 overflow-hidden rounded-2xl px-3 py-2.5">
                  {pct !== undefined && (
                    <motion.div
                      aria-hidden="true"
                      className="absolute inset-y-0 left-0 bg-white/[0.07]"
                      animate={{ width: `${pct}%` }}
                    />
                  )}
                  <FileGlyph contentType={file.type} className="relative" />
                  <div className="relative min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(file.size)}
                      {pct !== undefined && ` · ${Math.round(pct)}%`}
                    </p>
                  </div>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => onChange(files.filter((_, j) => j !== i))}
                      className="relative flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/10 hover:text-white"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="size-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ul>
    </div>
  )
}
