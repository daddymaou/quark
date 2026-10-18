import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { ok, unauthorized } from '@/lib/api'
import type { User } from '@/lib/types'

export const runtime = 'nodejs'

export async function GET() {
  const { auth } = await import('@clerk/nextjs/server')
  const { userId } = await auth()
  if (!userId) return unauthorized()

  const row = await db.query.users.findFirst({ where: eq(users.clerkId, userId) })
  if (!row) return ok(null)

  const profile: User = {
    id: row.id,
    email: row.email,
    username: row.username,
    displayName: row.displayName ?? undefined,
    avatarUrl: row.avatarUrl ?? undefined,
    plan: row.plan,
    publishedCount: row.publishedCount,
    maxPublished: row.maxPublished,
    createdAt: row.createdAt.toISOString(),
    emailVerified: row.emailVerified,
  }
  return ok(profile)
}
