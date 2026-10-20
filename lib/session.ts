import 'server-only'
import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto'
import { del, head } from '@vercel/blob'
import { keys, redis, SESSION_TTL_SECONDS } from './redis'
import {
  MAX_FILES,
  MAX_TEXT_LENGTH,
  type CreatedSession,
  type PublicSession,
} from './types'

type StoredFile = {
  pathname: string
  name: string
  size: number
  contentType: string
}

type StoredSession = {
  id: string
  code: string
  createdAt: number
  expiresAt: number
  text: string | null
  files: StoredFile[]
  ownerTokenHash: string
}

export const DRAFT_ID_PATTERN = /^[A-Za-z0-9_-]{16,64}$/
export const UPLOAD_PATH_PATTERN = /^glassdrop\/([A-Za-z0-9_-]{16,64})\/\d{1,2}-[^/]{1,180}$/
export const SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{22}$/

/** Orphaned uploads (never attached to a session) are purged after this window. */
const ORPHAN_UPLOAD_GRACE_MS = 10 * 60 * 1000

export class SessionError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
  }
}

const hashToken = (token: string) => createHash('sha256').update(token).digest()

export function isOwner(session: StoredSession, token: string | null) {
  if (!token) return false
  const expected = Buffer.from(session.ownerTokenHash, 'hex')
  const actual = hashToken(token)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

export async function trackUpload(pathname: string) {
  await redis.zadd(keys.purgeQueue, {
    score: Date.now() + ORPHAN_UPLOAD_GRACE_MS,
    member: pathname,
  })
}

async function reserveCode(id: string) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0')
    const ok = await redis.set(keys.code(code), id, {
      nx: true,
      ex: SESSION_TTL_SECONDS,
    })
    if (ok) return code
  }
  throw new SessionError('Could not allocate an access code. Try again.', 503)
}

export async function createSession(input: {
  text?: unknown
  draftId?: unknown
  files?: unknown
}): Promise<CreatedSession> {
  const text =
    typeof input.text === 'string' && input.text.trim().length > 0 ? input.text.trim() : null
  if (text && text.length > MAX_TEXT_LENGTH) {
    throw new SessionError('Text is too long.', 400)
  }

  const rawFiles = Array.isArray(input.files) ? input.files : []
  if (rawFiles.length > MAX_FILES) throw new SessionError('Too many files.', 400)
  if (!text && rawFiles.length === 0) throw new SessionError('Nothing to share.', 400)

  const draftId = typeof input.draftId === 'string' ? input.draftId : ''
  if (rawFiles.length > 0 && !DRAFT_ID_PATTERN.test(draftId)) {
    throw new SessionError('Invalid upload batch.', 400)
  }

  const files: StoredFile[] = await Promise.all(
    rawFiles.map(async (raw): Promise<StoredFile> => {
      const pathname = typeof raw?.pathname === 'string' ? raw.pathname : ''
      const match = UPLOAD_PATH_PATTERN.exec(pathname)
      if (!match || match[1] !== draftId) throw new SessionError('Invalid file reference.', 400)

      // Only files uploaded through our token route are queued for purge.
      const tracked = await redis.zscore(keys.purgeQueue, pathname)
      if (tracked === null) throw new SessionError('Unknown file.', 400)

      const meta = await head(pathname)
      const name =
        typeof raw?.name === 'string' && raw.name.length > 0
          ? raw.name.slice(0, 180)
          : pathname.split('/').pop()!
      return {
        pathname,
        name,
        size: meta.size,
        contentType: meta.contentType || 'application/octet-stream',
      }
    }),
  )

  const id = randomBytes(16).toString('base64url')
  const ownerToken = randomBytes(24).toString('base64url')
  const code = await reserveCode(id)
  const createdAt = Date.now()
  const expiresAt = createdAt + SESSION_TTL_SECONDS * 1000

  const session: StoredSession = {
    id,
    code,
    createdAt,
    expiresAt,
    text,
    files,
    ownerTokenHash: hashToken(ownerToken).toString('hex'),
  }

  const tx = redis.multi()
  tx.set(keys.session(id), session, { ex: SESSION_TTL_SECONDS })
  for (const file of files) {
    tx.zadd(keys.purgeQueue, { score: expiresAt, member: file.pathname })
  }
  await tx.exec()

  return { id, code, ownerToken, remainingMs: SESSION_TTL_SECONDS * 1000 }
}

export async function getStoredSession(id: string) {
  if (!SESSION_ID_PATTERN.test(id)) return null
  const [session, pttl] = await Promise.all([
    redis.get<StoredSession>(keys.session(id)),
    redis.pttl(keys.session(id)),
  ])
  if (!session || pttl <= 0) return null
  return { session, remainingMs: pttl }
}

export function toPublicSession(session: StoredSession, remainingMs: number): PublicSession {
  return {
    id: session.id,
    code: session.code,
    text: session.text,
    files: session.files.map((f, index) => ({
      index,
      name: f.name,
      size: f.size,
      contentType: f.contentType,
    })),
    remainingMs,
  }
}

export async function resolveCode(code: string) {
  if (!/^\d{6}$/.test(code)) return null
  return redis.get<string>(keys.code(code))
}

export async function markReceived(id: string, remainingMs: number) {
  await redis.set(keys.received(id), '1', { px: Math.max(remainingMs, 1) })
}

export async function isReceived(id: string) {
  return (await redis.exists(keys.received(id))) === 1
}

export async function destroySession(session: StoredSession) {
  const pathnames = session.files.map((f) => f.pathname)
  const tx = redis.multi()
  tx.del(keys.session(session.id), keys.code(session.code), keys.received(session.id))
  if (pathnames.length > 0) tx.zrem(keys.purgeQueue, ...pathnames)
  await tx.exec()
  if (pathnames.length > 0) await del(pathnames)
}

/** Deletes every blob whose session has expired. Safe to call from anywhere. */
export async function purgeExpiredBlobs() {
  const due = await redis.zrange<string[]>(keys.purgeQueue, 0, Date.now(), {
    byScore: true,
    offset: 0,
    count: 200,
  })
  if (due.length === 0) return 0
  await del(due)
  await redis.zrem(keys.purgeQueue, ...due)
  return due.length
}

export async function rateLimit(ip: string, limit = 12) {
  const key = keys.rateLimit(ip)
  const count = await redis.incr(key)
  if (count === 1) await redis.expire(key, 60)
  return count <= limit
}
