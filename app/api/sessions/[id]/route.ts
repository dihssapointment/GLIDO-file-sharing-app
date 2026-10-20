import { after, NextResponse } from 'next/server'
import {
  destroySession,
  getStoredSession,
  isOwner,
  markReceived,
  purgeExpiredBlobs,
  toPublicSession,
} from '@/lib/session'

const noStore = { 'Cache-Control': 'no-store' }

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const found = await getStoredSession(id)
  if (!found) {
    after(() => purgeExpiredBlobs().catch(() => {}))
    return NextResponse.json({ error: 'Session expired' }, { status: 410, headers: noStore })
  }
  await markReceived(id, found.remainingMs)
  return NextResponse.json(toPublicSession(found.session, found.remainingMs), {
    headers: noStore,
  })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const found = await getStoredSession(id)
  if (!found) return NextResponse.json({ ok: true }, { headers: noStore })
  if (!isOwner(found.session, request.headers.get('x-owner-token'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: noStore })
  }
  await destroySession(found.session)
  return NextResponse.json({ ok: true }, { headers: noStore })
}
