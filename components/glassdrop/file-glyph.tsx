import { File, FileArchive, FileAudio, FileImage, FileText, FileVideo } from 'lucide-react'
import { cn } from '@/lib/utils'

function pickIcon(contentType: string) {
  if (contentType.startsWith('image/')) return FileImage
  if (contentType.startsWith('video/')) return FileVideo
  if (contentType.startsWith('audio/')) return FileAudio
  if (contentType === 'application/pdf' || contentType.startsWith('text/')) return FileText
  if (/zip|tar|rar|7z|gzip/.test(contentType)) return FileArchive
  if (/word|document|sheet|excel|presentation|powerpoint/.test(contentType)) return FileText
  return File
}

export function FileGlyph({ contentType, className }: { contentType: string; className?: string }) {
  const Icon = pickIcon(contentType)
  return (
    <span
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06]',
        className,
      )}
    >
      <Icon className="size-5 text-white" aria-hidden="true" />
    </span>
  )
}
