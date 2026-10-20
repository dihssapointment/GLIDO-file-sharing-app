import { NextResponse } from 'next/server'
import { purgeExpiredBlobs } from '@/lib/session'

/** Client-triggered sweep at countdown end. Only ever deletes blobs already past their deadline. */
export async function POST() {
  const purged = await purgeExpiredBlobs()
  return NextResponse.json({ purged })
}

/** Vercel Cron safety net. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const purged = await purgeExpiredBlobs()
  return NextResponse.json({ purged })
}
