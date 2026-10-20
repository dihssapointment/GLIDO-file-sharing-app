import { get } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'
import { getStoredSession } from '@/lib/session'

const INLINE_SAFE_TYPES = /^(image\/(png|jpe?g|gif|webp|avif)|application\/pdf|video\/(mp4|webm)|audio\/)/

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; index: string }> },
) {
  const { id, index } = await params
  const found = await getStoredSession(id)
  if (!found) return NextResponse.json({ error: 'Session expired' }, { status: 410 })

  const file = found.session.files[Number.parseInt(index, 10)]
  if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const result = await get(file.pathname, { access: 'private' })
  if (!result || result.statusCode !== 200) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const wantsInline = request.nextUrl.searchParams.get('inline') === '1'
  const inline = wantsInline && INLINE_SAFE_TYPES.test(file.contentType)
  const encodedName = encodeURIComponent(file.name)

  return new NextResponse(result.stream, {
    headers: {
      'Content-Type': inline ? file.contentType : 'application/octet-stream',
      'Content-Length': String(file.size),
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodedName}`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
