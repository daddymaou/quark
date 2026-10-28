import { NextRequest } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { projects, users, projectVersions } from '@/lib/db/schema'
import { ok, created, notFound, unauthorized } from '@/lib/api'
import { snapshotProjectFiles } from '@/lib/project-versions'

export const runtime = 'nodejs'

async function requireProjectOwner(projectId: string) {
  const { auth } = await import('@clerk/nextjs/server')
  const { userId } = await auth()
  if (!userId) return { error: unauthorized() }
  const row = await db.query.projects.findFirst({ where: eq(projects.id, projectId) })
  if (!row) return { error: notFound('Project not found') }
  const owner = await db.query.users.findFirst({ where: eq(users.clerkId, userId) })
  if (!owner || owner.id !== row.ownerId) return { error: unauthorized() }
  return { row, owner }
}

export async function GET(req: NextRequest, { params }) {
  const { id } = await params
  const auth = await requireProjectOwner(id)
  if ('error' in auth) return auth.error
  const { row } = auth
  const versions = await db
    .select({
      id: projectVersions.id,
      summary: projectVersions.summary,
      createdAt: projectVersions.createdAt,
      fileCount: projectVersions.files.length,
    })
    .from(projectVersions)
    .where(eq(projectVersions.projectId, row.id))
    .orderBy(desc(projectVersions.createdAt), desc(projectVersions.id))
    .limit(20)
  return ok(versions)
}

export async function POST(req: NextRequest, { params }) {
  const auth = await requireProjectOwner(params.id!)
  if ('error' in auth) return auth.error
  const { row } = auth

  const body = await req.json().catch(() => ({}))
  const summary =
    typeof body?.summary === 'string' && body.summary.trim()
      ? body.summary.trim().slice(0, 80)
      : 'Saved'

  const version = await snapshotProjectFiles(row.id, row.files, summary)
  if (!version) return ok(null, 'No changes since the last version')
  return created({
    id: version.id,
    summary: version.summary,
    createdAt: version.createdAt.toISOString(),
    fileCount: version.files.length,
  })
}