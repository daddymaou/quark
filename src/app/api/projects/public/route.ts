import { NextRequest } from 'next/server'
import { arrayContains } from 'drizzle-orm'
import { db } from '@/lib/db'
import { ok } from '@/lib/api'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').toLowerCase()
  const tag = (searchParams.get('tag') || '').toLowerCase()
  const sort = searchParams.get('sort') || 'recent'

  const rows = await db.query.projects.findMany({
    where: (p, { eq, or, like, and }) => {
      const filters = [eq(p.visibility, 'public')]
      if (tag) filters.push(arrayContains(p.tags, [tag]))
      if (q) {
        filters.push(
          or(
            like(p.name, `%${q}%`),
            like(p.description ?? '', `%${q}%`),
          )!
        )
      }
      return and(...filters)
    },
    orderBy: (p, { desc }) =>
      sort === 'trending'
        ? [desc(p.forksCount)]
        : [desc(p.publishedAt ?? p.updatedAt)],
  })

  const { users } = await import('@/lib/db/schema')
  const authors = await db.select().from(users)

  const authorMap = new Map(authors.map((u) => [u.id, u]))

  const data = rows.map((r) => {
    const author = authorMap.get(r.ownerId)
    return {
      id: r.id,
      title: r.name,
      description: r.description || '',
      tags: r.tags,
      author: author ? `@${author.username}` : '@unknown',
      updatedAt: r.updatedAt.toISOString(),
      forks: r.forksCount,
      views: r.viewsCount,
    }
  })

  return ok(data)
}
