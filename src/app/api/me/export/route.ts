// app/api/me/export/route.ts
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users, projects, comments, reports, notifications } from '@/lib/db/schema'
import { ok, unauthorized, notFound } from '@/lib/api'

export const runtime = 'nodejs'

export async function GET() {
  const { auth } = await import('@clerk/nextjs/server')
  const { userId } = await auth()
  if (!userId) return unauthorized()

  const row = await db.query.users.findFirst({ where: eq(users.clerkId, userId) })
  if (!row) return notFound('Account not found')

  const [penRows, commentRows, reportRows, notificationRows] = await Promise.all([
    db.select().from(projects).where(eq(projects.ownerId, row.id)),
    db.select().from(comments).where(eq(comments.userId, row.id)),
    db.select().from(reports).where(eq(reports.reporterId, row.id)),
    db.select().from(notifications).where(eq(notifications.userId, row.id)),
  ])

  return ok({
    exportedAt: new Date().toISOString(),
    profile: {
      email: row.email,
      username: row.username,
      displayName: row.displayName,
      bio: row.bio,
      plan: row.plan,
      role: row.role,
      createdAt: row.createdAt.toISOString(),
    },
    pens: penRows.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      visibility: p.visibility,
      tags: p.tags,
      files: p.files,
      dependencies: p.dependencies,
      forksCount: p.forksCount,
      viewsCount: p.viewsCount,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
    })),
    comments: commentRows.map((c) => ({
      id: c.id,
      projectId: c.projectId,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
    })),
    reports: reportRows.map((r) => ({
      id: r.id,
      projectId: r.projectId,
      reason: r.reason,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    })),
    notifications: notificationRows.map((n) => ({
      id: n.id,
      type: n.type,
      message: n.message,
      read: n.read,
      link: n.link,
      createdAt: n.createdAt.toISOString(),
    })),
  })
}
