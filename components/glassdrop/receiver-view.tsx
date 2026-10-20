'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Copy, Download, ExternalLink, Loader2, PackageOpen } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import useSWR from 'swr'
import { useCountdown } from '@/hooks/use-countdown'
import { fetchJson, formatBytes, formatClock, HttpError, isUrl, triggerDownload } from '@/lib/client'
import type { PublicFile, PublicSession } from '@/lib/types'
import { ExpiredState } from './expired-state'
import { FileGlyph } from './file-glyph'
import { GlassButton, GlassPanel } from './glass'
import { useToast } from './toast'

type Loaded = PublicSession & { deadline: number }

const fileUrl = (id: string, index: number, inline = false) =>
  `/api/sessions/${id}/files/${index}${inline ? '?inline=1' : ''}`

export function ReceiverView({ id }: { id: string }) {
  const router = useRouter()
  const [expired, setExpired] = useState(false)

  const { data, error, isLoading } = useSWR<Loaded>(
    expired ? null : `/api/sessions/${id}`,
    async (url: string) => {
      const session = await fetchJson<PublicSession>(url)
      return { ...session, deadline: Date.now() + session.remainingMs }
    },
    {
      refreshInterval: 3000,
      onError: (err) => {
        if (err instanceof HttpError && (err.status === 410 || err.status === 404)) setExpired(true)
      },
    },
  )

  const remaining = useCountdown(data?.deadline ?? null, () => {
    fetch('/api/purge', { method: 'POST' }).catch(() => {})
    setExpired(true)
  })

  return (
    <AnimatePresence mode="wait">
      {expired ? (
        <GlassPanel key="expired">
          <ExpiredState onRestart={() => router.push('/')} />
        </GlassPanel>
      ) : isLoading || !data ? (
        <GlassPanel key="loading" className="flex items-center justify-center py-20">
          {error ? (
            <p className="text-sm text-muted-foreground">Could not load this drop. Retrying…</p>
          ) : (
            <Loader2 className="size-6 animate-spin text-white" aria-label="Loading" />
          )}
        </GlassPanel>
      ) : (
        <GlassPanel key="content" className="flex flex-col gap-5">
          <ReceiverHeader session={data} remaining={remaining} />
          {data.text && <TextCard text={data.text} />}
          {data.files.length > 0 && <FileList id={id} code={data.code} files={data.files} />}
        </GlassPanel>
      )}
    </AnimatePresence>
  )
}

function ReceiverHeader({ session, remaining }: { session: Loaded; remaining: number }) {
  const pct = Math.min(100, (remaining / 120_000) * 100)
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-white">Incoming drop</h1>
          <p className="text-sm text-muted-foreground">
            {session.files.length > 0 &&
              `${session.files.length} file${session.files.length === 1 ? '' : 's'}`}
            {session.files.length > 0 && session.text && ' · '}
            {session.text && 'text snippet'}
          </p>
        </div>
        <div
          className="glass-subtle flex shrink-0 flex-col items-end rounded-2xl px-3 py-2"
          role="timer"
          aria-label={`Expires in ${formatClock(remaining)}`}
        >
          <span className="text-glow font-mono text-xl font-semibold tabular-nums text-white">
            {formatClock(remaining)}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            until purge
          </span>
        </div>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-white/[0.08]" aria-hidden="true">
        <motion.div
          className="h-full rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.7)]"
          animate={{ width: `${pct}%` }}
          transition={{ ease: 'linear', duration: 0.25 }}
        />
      </div>
    </div>
  )
}

function TextCard({ text }: { text: string }) {
  const { toast } = useToast()
  const link = isUrl(text)

  return (
    <div className="glass-subtle flex flex-col gap-3 rounded-3xl p-4">
      <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {link ? 'Link' : 'Text'}
      </span>
      {link ? (
        <a
          href={text}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="break-all text-base font-medium text-white underline decoration-white/30 underline-offset-4 hover:decoration-white"
        >
          {text}
        </a>
      ) : (
        <p className="max-h-72 overflow-y-auto whitespace-pre-wrap break-words text-base leading-relaxed text-white">
          {text}
        </p>
      )}
      <div className="flex gap-2">
        <GlassButton
          variant="primary"
          className="flex-1"
          onClick={async () => {
            await navigator.clipboard.writeText(text)
            toast('Copied to Clipboard!')
          }}
        >
          <Copy className="size-4" aria-hidden="true" />
          {link ? 'Copy Link' : 'Copy Text'}
        </GlassButton>
        {link && (
          <GlassButton onClick={() => window.open(text, '_blank', 'noopener,noreferrer')}>
            <ExternalLink className="size-4" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">Open</span>
          </GlassButton>
        )}
      </div>
    </div>
  )
}

function FileList({ id, code, files }: { id: string; code: string; files: PublicFile[] }) {
  const { toast } = useToast()
  const [zipping, setZipping] = useState(false)
  const images = files.filter((f) => /^image\/(png|jpe?g|gif|webp|avif)$/.test(f.contentType))
  const others = files.filter((f) => !images.includes(f))

  async function downloadAll() {
    if (files.length === 1) {
      triggerDownload(fileUrl(id, files[0].index), files[0].name)
      return
    }
    setZipping(true)
    try {
      const { default: JSZip } = await import('jszip')
      const zip = new JSZip()
      const used = new Set<string>()
      await Promise.all(
        files.map(async (f) => {
          const res = await fetch(fileUrl(id, f.index))
          if (!res.ok) throw new Error('Download failed')
          let name = f.name
          for (let n = 1; used.has(name); n++) name = `${n}-${f.name}`
          used.add(name)
          zip.file(name, await res.blob())
        }),
      )
      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      triggerDownload(url, `glassdrop-${code}.zip`)
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
      toast('Download started')
    } catch {
      toast('Download failed — session may have expired', 'info')
    } finally {
      setZipping(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {images.length > 0 && (
        <ul className="grid grid-cols-2 gap-3" aria-label="Photos">
          {images.map((f, i) => (
            <motion.li
              key={f.index}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="glass-subtle group relative aspect-square overflow-hidden rounded-3xl"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fileUrl(id, f.index, true)}
                alt={f.name}
                className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-x-2 bottom-2 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/50 px-3 py-2 backdrop-blur-xl">
                <p className="min-w-0 flex-1 truncate text-xs font-medium text-white">{f.name}</p>
                <button
                  type="button"
                  onClick={() => triggerDownload(fileUrl(id, f.index), f.name)}
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-110"
                  aria-label={`Download ${f.name}`}
                >
                  <Download className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            </motion.li>
          ))}
        </ul>
      )}

      {others.length > 0 && (
        <ul className="flex flex-col gap-2" aria-label="Files">
          {others.map((f, i) => (
            <motion.li
              key={f.index}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-subtle flex items-center gap-3 rounded-2xl px-3 py-2.5"
            >
              <FileGlyph contentType={f.contentType} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{f.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(f.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => triggerDownload(fileUrl(id, f.index), f.name)}
                className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white transition-all hover:bg-white hover:text-black hover:shadow-[0_0_20px_-2px_rgba(255,255,255,0.5)]"
                aria-label={`Download ${f.name}`}
              >
                <Download className="size-4" aria-hidden="true" />
              </button>
            </motion.li>
          ))}
        </ul>
      )}

      <GlassButton variant="primary" onClick={downloadAll} disabled={zipping} className="h-12 text-base">
        {zipping ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : files.length > 1 ? (
          <PackageOpen className="size-4" aria-hidden="true" />
        ) : (
          <Download className="size-4" aria-hidden="true" />
        )}
        {zipping ? 'Packing…' : files.length > 1 ? 'Download All' : 'Download'}
      </GlassButton>
    </div>
  )
}
