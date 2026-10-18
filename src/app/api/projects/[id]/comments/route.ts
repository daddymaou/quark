import { NextRequest } from 'next/server'
import { eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { projects, comments } from '@/lib/db/schema'
import { generateId } from '@/lib/db/ids'
import { ok, created, fail, notFound, unauthorized } from '@/lib/api'
import { getOrCreateUser } from '@/app/api/projects/route'

export const runtime = 'nodejs'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const rows = await db.query.comments.findMany({
    where: (c, { eq: eqC }) => eqC(c.projectId, id),
    orderBy: (c, { asc }) => [asc(c.createdAt)],
  })
  if (rows.length === 0) return ok([])

  const { users } = await import('@/lib/db/schema')
  const userIds = [...new Set(rows.map((r) => r.userId))]
  const authors = await db.select().from(users).where(inArray(users.id, userIds))
  const authorMap = new Map(authors.map((u) => [u.id, u]))

  return ok(
    rows.map((r) => {
      const author = authorMap.get(r.userId)
      return {
        ...r,
        author: author?.username ?? null,
        authorAvatar: author?.avatarUrl ?? null,
      }
    })
  )
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { auth } = await import('@clerk/nextjs/server')
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return unauthorized()

  const project = await db.query.projects.findFirst({ where: eq(projects.id, id) })
  if (!project) return notFound('Pen not found')

  const body = await req.json()
  const content = (body?.content as string)?.trim()
  if (!content || content.length > 1000) return fail('Comment must be 1-1000 characters')

  const cursor = await auth()
  const claims = cursor.sessionClaims
  const email = (claims?.email as string) || 'user@quark.dev'
  const username = (claims?.username as string) || `user-${clerkUserId.slice(0, 8)}`
  const displayName = (claims?.name as string) || username
  const user = await getOrCreateUser({ clerkId: clerkUserId, email, username, displayName })

  const commentId = generateId('comment')
  await db.insert(comments).values({
    id: commentId,
    projectId: id,
    userId: user.id,
    content,
  })

  // notify the pen owner unless they commented on their own pen
  if (project.ownerId !== user.id) {
    const { notifications } = await import('@/lib/db/schema')
    await db.insert(notifications).values({
      id: generateId('notif'),
      userId: project.ownerId,
      type: 'comment',
      message: `${user.displayName || user.username} commented on "${project.name}".`,
      link: project.visibility === 'private' ? `/pen/${id}` : `/p/${id}`,
    })
  }

  const row = await db.query.comments.findFirst({ where: eq(comments.id, commentId) })
  if (!row) return fail('Failed to create comment', 500)
  return created(row, 'Comment posted')
}
