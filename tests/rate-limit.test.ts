import { eq, like } from 'drizzle-orm'
import { beforeAll, afterAll, it, expect } from 'vitest'
import { describeDb, testDb, runMigration, unique, schema } from './helpers'
import { consumeRateLimit, tooManyRequests, clientIp } from '@/lib/rate-limit'

describeDb('Rate limiting', () => {
  const db = testDb()
  const keyPrefix = unique('rl')

  beforeAll(async () => {
    await runMigration()
  })

  afterAll(async () => {
    await db
      .delete(schema.rateLimits)
      .where(like(schema.rateLimits.key, `${keyPrefix}%`))
  })

  it('allows up to the limit and blocks the request after it', async () => {
    const key = `${keyPrefix}-allow`
    const limit = 3
    const windowMs = 60_000

    for (let i = 1; i <= limit; i++) {
      const result = await consumeRateLimit(key, limit, windowMs)
      expect(result.allowed).toBe(true)
      expect(result.count).toBe(i)
    }

    const blocked = await consumeRateLimit(key, limit, windowMs)
    expect(blocked.allowed).toBe(false)
    expect(blocked.count).toBe(limit + 1)
    expect(blocked.retryAfterSeconds).toBeGreaterThanOrEqual(1)
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(60)
  })

  it('resets the counter when the window rolls over', async () => {
    const key = `${keyPrefix}-rollover`
    const limit = 1
    const windowMs = 60_000

    const first = await consumeRateLimit(key, limit, windowMs)
    expect(first.allowed).toBe(true)

    const second = await consumeRateLimit(key, limit, windowMs)
    expect(second.allowed).toBe(false)

    // simulate the window expiring without sleeping in the test
    await db
      .update(schema.rateLimits)
      .set({ windowStart: new Date(Date.now() - windowMs * 2) })
      .where(eq(schema.rateLimits.key, key))

    const third = await consumeRateLimit(key, limit, windowMs)
    expect(third.allowed).toBe(true)
    expect(third.count).toBe(1)
  })

  it('tracks each key independently', async () => {
    const windowMs = 60_000
    const keyA = `${keyPrefix}-independent-a`
    const keyB = `${keyPrefix}-independent-b`

    await consumeRateLimit(keyA, 1, windowMs)
    const blockedA = await consumeRateLimit(keyA, 1, windowMs)
    expect(blockedA.allowed).toBe(false)

    const freshB = await consumeRateLimit(keyB, 1, windowMs)
    expect(freshB.allowed).toBe(true)
  })

  it('cleans up stale rows from previous days', async () => {
    const key = `${keyPrefix}-stale`
    await consumeRateLimit(key, 10, 60_000)

    // a row older than the 1-day cleanup horizon
    const staleKey = `${keyPrefix}-ancient`
    await db.insert(schema.rateLimits).values({
      key: staleKey,
      windowStart: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      count: 99,
    })

    await consumeRateLimit(`${key}-trigger`, 10, 60_000)

    const stale = await db.query.rateLimits.findFirst({
      where: eq(schema.rateLimits.key, staleKey),
    })
    expect(stale).toBeUndefined()
  })
})

describeDb('Rate limit response helpers', () => {
  it('returns a 429 with Retry-After and the standard envelope', async () => {
    const res = tooManyRequests(42)
    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBe('42')
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(typeof body.error).toBe('string')
  })

  it('extracts the first forwarded client IP', () => {
    expect(clientIp(new Headers({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' }))).toBe('1.2.3.4')
    expect(clientIp(new Headers({ 'x-real-ip': '9.9.9.9' }))).toBe('9.9.9.9')
    expect(clientIp(new Headers())).toBe('unknown')
  })
})
