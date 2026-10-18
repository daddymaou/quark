// lib/rate-limit.ts
import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

export interface RateLimitResult {
  allowed: boolean
  retryAfterSeconds: number
  count: number
}

/**
 * Fixed-window rate limiter backed by Postgres so it works across
 * serverless instances (no in-memory state to lose). Each call atomically
 * upserts the counter for the current window and returns the new count.
 * Stale rows from previous days are cleaned up opportunistically.
 */
export async function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs)

  const result = await db.execute(sql`
    with cleaned as (
      delete from rate_limits where window_start < now() - interval '1 day'
    )
    insert into rate_limits (key, window_start, count)
    values (${key}, ${windowStart}, 1)
    on conflict (key) do update set
      count = case
        when rate_limits.window_start = ${windowStart} then rate_limits.count + 1
        else 1
      end,
      window_start = case
        when rate_limits.window_start = ${windowStart} then rate_limits.window_start
        else ${windowStart}
      end
    returning count
  `)

  const rows = (result as unknown as { rows?: Array<{ count: number | string }> }).rows ?? []
  const count = Number(rows[0]?.count ?? 0)

  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((windowStart.getTime() + windowMs - Date.now()) / 1000)
  )

  return { allowed: count <= limit, retryAfterSeconds, count }
}

export function tooManyRequests(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    { success: false, error: 'Too many requests. Please slow down and try again shortly.' },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
  )
}

/** Best-effort client IP for rate-limiting unauthenticated endpoints. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return headers.get('x-real-ip') || 'unknown'
}
