'use client'

import { upload } from '@vercel/blob/client'
import { AnimatePresence, motion } from 'framer-motion'
import { FileUp, Loader2, Send, Type } from 'lucide-react'
import { useState } from 'react'
import { fetchJson, randomId, safeFileName } from '@/lib/client'
import { MAX_TEXT_LENGTH, type CreatedSession } from '@/lib/types'
import { Dropzone } from './dropzone'
import { GlassButton } from './glass'
import { Segmented } from './segmented'
import { useToast } from './toast'

type Tab = 'files' | 'text'

export function SenderCompose({ onCreated }: { onCreated: (session: CreatedSession) => void }) {
  const { toast } = useToast()
  const [tab, setTab] = useState<Tab>('files')
  const [files, setFiles] = useState<File[]>([])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<Record<number, number>>({})
  const [error, setError] = useState<string | null>(null)

  const canShare = !busy && (files.length > 0 || text.trim().length > 0)

  async function share() {
    setBusy(true)
    setError(null)
    try {
      const draftId = randomId(24)
      const uploaded = await Promise.all(
        files.map(async (file, i) => {
          const pathname = `glassdrop/${draftId}/${i}-${safeFileName(file.name)}`
          const blob = await upload(pathname, file, {
            access: 'private',
            handleUploadUrl: '/api/upload',
            contentType: file.type || undefined,
            multipart: file.size > 8 * 1024 * 1024,
            onUploadProgress: ({ percentage }) =>
              setProgress((p) => ({ ...p, [i]: percentage })),
          })
          return { pathname: blob.pathname, name: file.name }
        }),
      )

      const created = await fetchJson<CreatedSession>('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, draftId, files: uploaded }),
      })
      onCreated(created)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setProgress({})
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Drop it. Share it. Gone in two.
        </h1>
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
          Files and text live for exactly 2 minutes, then they&apos;re permanently purged.
        </p>
      </div>

      <Segmented
        label="Content type"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'files', label: files.length ? `Files (${files.length})` : 'Files', icon: FileUp },
          { value: 'text', label: 'Text / Link', icon: Type },
        ]}
      />

      <AnimatePresence mode="wait" initial={false}>
        {tab === 'files' ? (
          <motion.div
            key="files"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.18 }}
          >
            <Dropzone
              files={files}
              onChange={setFiles}
              disabled={busy}
              progress={busy ? progress : undefined}
              onReject={(m) => toast(m, 'info')}
            />
          </motion.div>
        ) : (
          <motion.div
            key="text"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col gap-2"
          >
            <label htmlFor="share-text" className="sr-only">
              Text or link to share
            </label>
            <textarea
              id="share-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={MAX_TEXT_LENGTH}
              disabled={busy}
              rows={7}
              placeholder="Paste a note, password hint, or https://link…"
              className="glass-subtle w-full resize-none rounded-3xl px-5 py-4 text-base leading-relaxed text-white placeholder:text-zinc-500 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50"
            />
            <p className="self-end text-xs tabular-nums text-muted-foreground">
              {text.length.toLocaleString()} / {MAX_TEXT_LENGTH.toLocaleString()}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {(files.length > 0 && text.trim()) ? (
        <p className="text-xs text-muted-foreground">
          Sharing {files.length} file{files.length === 1 ? '' : 's'} and a text snippet together.
        </p>
      ) : null}

      {error && (
        <p role="alert" className="rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white">
          {error}
        </p>
      )}

      <GlassButton variant="primary" onClick={share} disabled={!canShare} className="h-12 text-base">
        {busy ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            {files.length ? 'Uploading…' : 'Creating session…'}
          </>
        ) : (
          <>
            <Send className="size-4" aria-hidden="true" />
            Share
          </>
        )}
      </GlassButton>
    </div>
  )
}
