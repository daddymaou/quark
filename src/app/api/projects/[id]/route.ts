import { NextRequest } from 'next/server'
import { and, count, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { projects } from '@/lib/db/schema'
import { ok, created, fail, notFound, unauthorized } from '@/lib/api'
import type { Project } from '@/lib/types'

export const runtime = 'nodejs'

function toProject(row: typeof projects.$inferSelect): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    ownerId: row.ownerId,
    files: row.files,
    dependencies: row.dependencies,
    visibility: row.visibility,
    tags: row.tags,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : undefined,
  }
}

function toProjectWithAuthor(row: typeof projects.$inferSelect) {
  return {
    ...toProject(row),
    forksCount: row.forksCount,
    viewsCount: row.viewsCount,
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const row = await db.query.projects.findFirst({ where: eq(projects.id, id) })
  if (!row) return notFound('Pen not found')

  let author: string | null = null
  if (row.visibility === 'public' || row.visibility === 'unlisted') {
    const { users } = await import('@/lib/db/schema')
    const owner = await db.query.users.findFirst({ where: (u, { eq: e }) => e(u.id, row.ownerId) })
    author = owner ? owner.username : null
    return ok({ ...toProjectWithAuthor(row), author })
  }

  const { auth } = await import('@clerk/nextjs/server')
  const { userId } = await auth()
  if (!userId) return unauthorized()

  const { users } = await import('@/lib/db/schema')
  const owner = await db.query.users.findFirst({ where: (u, { eq: e }) => e(u.clerkId, userId) })
  if (!owner || owner.id !== row.ownerId) return unauthorized()
  return ok({ ...toProjectWithAuthor(row), author: owner.username })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { auth } = await import('@clerk/nextjs/server')
  const { userId } = await auth()
  if (!userId) return unauthorized()

  const row = await db.query.projects.findFirst({ where: eq(projects.id, id) })
  if (!row) return notFound('Pen not found')

  const { users } = await import('@/lib/db/schema')
  const { eq: eqUsers } = await import('drizzle-orm')
  const owner = await db.query.users.findFirst({ where: eqUsers(users.clerkId, userId) })
  if (!owner || owner.id !== row.ownerId) return unauthorized()

  const body = await req.json()

  const updates: Partial<typeof projects.$inferInsert> = {}
  if (typeof body?.name === 'string') updates.name = body.name
  if (typeof body?.description === 'string') updates.description = body.description
  if (Array.isArray(body?.files)) updates.files = body.files
  if (body?.dependencies && typeof body.dependencies === 'object') updates.dependencies = body.dependencies

  const nextVisibility =
    body?.visibility && ['private', 'public', 'unlisted'].includes(body.visibility)
      ? (body.visibility as 'private' | 'public' | 'unlisted')
      : null
  const wasPublic = row.visibility === 'public'
  const willBePublic = nextVisibility === 'public'

  if (nextVisibility) {
    if (willBePublic && !wasPublic) {
      const [{ total }] = await db
        .select({ total: count() })
        .from(projects)
        .where(and(eq(projects.ownerId, owner.id), eq(projects.visibility, 'public')))
      if (total >= owner.maxPublished) {
        return fail(
          `Publish limit reached — your plan allows ${owner.maxPublished} published pens. Upgrade to publish more.`,
          403
        )
      }
    }
    updates.visibility = nextVisibility
    if (willBePublic && !row.publishedAt) {
      updates.publishedAt = new Date()
    }
  }
  if (Array.isArray(body?.tags)) updates.tags = body.tags
  updates.updatedAt = new Date()

  await db.update(projects).set(updates).where(eq(projects.id, id))

  if (nextVisibility && willBePublic !== wasPublic) {
    if (willBePublic) {
      await db
        .update(users)
        .set({ publishedCount: sql`${users.publishedCount} + 1` })
        .where(eq(users.id, owner.id))
    } else {
      await db
        .update(users)
        .set({ publishedCount: sql`greatest(${users.publishedCount} - 1, 0)` })
        .where(eq(users.id, owner.id))
    }
  }

  const updated = await db.query.projects.findFirst({ where: eq(projects.id, id) })
  if (!updated) return notFound('Pen not found')
  return ok(toProject(updated))
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { auth } = await import('@clerk/nextjs/server')
  const { userId } = await auth()
  if (!userId) return unauthorized()

  const row = await db.query.projects.findFirst({ where: eq(projects.id, id) })
  if (!row) return notFound('Pen not found')

  const { users } = await import('@/lib/db/schema')
  const { eq: eqUsers } = await import('drizzle-orm')
  const owner = await db.query.users.findFirst({ where: eqUsers(users.clerkId, userId) })
  if (!owner || owner.id !== row.ownerId) return unauthorized()

  await db.delete(projects).where(eq(projects.id, id))
  return ok({ id }, 'Pen deleted')
}
