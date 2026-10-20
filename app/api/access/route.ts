import { after, NextResponse } from 'next/server'
import { purgeExpiredBlobs, rateLimit, resolveCode } from '@/lib/session'

export async function POST(request: Request) {
  after(() => purgeExpiredBlobs().catch(() => {}))

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (!(await rateLimit(ip))) {
    return NextResponse.json(
      { error: 'Too many attempts. Wait a minute and try again.' },
      { status: 429 },
    )
  }

  const { code } = (await request.json().catch(() => ({}))) as { code?: unknown }
  const id = typeof code === 'string' ? await resolveCode(code) : null
  if (!id) {
    return NextResponse.json({ error: 'Invalid or expired code.' }, { status: 404 })
  }
  return NextResponse.json({ id }, { headers: { 'Cache-Control': 'no-store' } })
}
