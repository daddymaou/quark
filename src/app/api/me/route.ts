import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { ok, unauthorized, notFound } from '@/lib/api'
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

export async function DELETE() {
  const { auth } = await import('@clerk/nextjs/server')
  const { userId } = await auth()
  if (!userId) return unauthorized()

  const row = await db.query.users.findFirst({ where: eq(users.clerkId, userId) })
  if (!row) return notFound('Account not found')

  // delete the database row first — cascades wipe pens, comments, reports,
  // and notifications; if the Clerk deletion below fails the user simply
  // gets a fresh empty account on next sign-in, with no data leaked
  await db.delete(users).where(eq(users.id, row.id))

  try {
    const { clerkClient } = await import('@clerk/nextjs/server')
    const client = await clerkClient()
    await client.users.deleteUser(userId)
  } catch (err) {
    console.error('Clerk user deletion failed after database deletion:', err)
  }

  return ok({ deleted: true }, 'Account deleted')
}
