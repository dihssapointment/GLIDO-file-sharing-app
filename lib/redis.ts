import 'server-only'
import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

/** Hard lifetime of every share. All session keys are written with `EX 120`. */
export const SESSION_TTL_SECONDS = 120

/**
 * Redis key layout
 *
 * glassdrop:session:{id}   STRING (JSON)  EX 120   session metadata + text
 * glassdrop:code:{code}    STRING (id)    EX 120   6-digit code -> session id (SET NX)
 * glassdrop:received:{id}  STRING ("1")   EX 120   set when a receiver opens the share
 * glassdrop:purge          ZSET                    blob pathname -> unix ms deadline
 * glassdrop:rl:{ip}        STRING (count) EX 60    code-guess rate limit
 */
export const keys = {
  session: (id: string) => `glassdrop:session:${id}`,
  code: (code: string) => `glassdrop:code:${code}`,
  received: (id: string) => `glassdrop:received:${id}`,
  purgeQueue: 'glassdrop:purge',
  rateLimit: (ip: string) => `glassdrop:rl:${ip}`,
}
