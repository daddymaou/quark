import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { projects, users, projectVersions } from '@/lib/db/schema'
import { ok, notFound, unauthorized } from '@/lib/api'
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

export async function POST(req: NextRequest, { params: { id, versionId } }) {
  const auth = await requireProjectOwner(id)
  if ('error' in auth) return auth.error
  const { row } = auth

  const version = await db.query.projectVersions.findFirst({
    where: and(eq(projectVersions.id, versionId), eq(projectVersions.projectId, row.id)),
  })
  if (!version) return notFound('Version not found')

  // reversible: snapshot current state before overwrite
  await snapshotProjectFiles(row.id, row.files, 'Before restore')

  await db
    .update(projects)
    .set({ files: version.files, updatedAt: new Date().toISOString() })
    .where(eq(projects.id, row.id))

  const updated = await db.query.projects.findFirst({
    where: eq(projects.id, row.id),
  })
  if (!updated) return notFound('Project not found after update')

  return ok({
    id: updated.id,
    name: updated.name,
    description: updated.description,
    visibility: updated.visibility,
    files: updated.files,
    dependencies: updated.dependencies,
    tags: updated.tags,
    ownerId: updated.ownerId,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
    publishedAt: updated.publishedAt?.toISOString(),
  })
}