import { after, NextResponse } from 'next/server'
import { createSession, purgeExpiredBlobs, SessionError } from '@/lib/session'

export async function POST(request: Request) {
  after(() => purgeExpiredBlobs().catch(() => {}))

  try {
    const body = await request.json()
    const created = await createSession(body ?? {})
    return NextResponse.json(created, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    if (error instanceof SessionError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[glassdrop] create session failed', error)
    return NextResponse.json({ error: 'Could not create session' }, { status: 500 })
  }
}
