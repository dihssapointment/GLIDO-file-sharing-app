import { after, NextResponse } from 'next/server'
import { getStoredSession, isOwner, isReceived, purgeExpiredBlobs } from '@/lib/session'
import type { SessionStatus } from '@/lib/types'

const noStore = { 'Cache-Control': 'no-store' }

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const found = await getStoredSession(id)
  if (!found) {
    after(() => purgeExpiredBlobs().catch(() => {}))
    return NextResponse.json({ error: 'Session expired' }, { status: 410, headers: noStore })
  }
  if (!isOwner(found.session, request.headers.get('x-owner-token'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: noStore })
  }
  const status: SessionStatus = {
    received: await isReceived(id),
    remainingMs: found.remainingMs,
  }
  return NextResponse.json(status, { headers: noStore })
}
