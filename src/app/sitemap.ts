// app/sitemap.ts
import type { MetadataRoute } from 'next'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { projects, users } from '@/lib/db/schema'

const BASE_URL = 'https://quark.dev'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/explore`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/pricing`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/sign-up`, changeFrequency: 'monthly', priority: 0.5 },
  ]

  try {
    const pens = await db
      .select({ id: projects.id, updatedAt: projects.updatedAt })
      .from(projects)
      .where(eq(projects.visibility, 'public'))
      .limit(5000)

    const profileRows = await db
      .selectDistinct({ username: users.username })
      .from(users)
      .innerJoin(projects, eq(projects.ownerId, users.id))
      .where(eq(projects.visibility, 'public'))
      .limit(5000)

    return [
      ...staticRoutes,
      ...pens.map((pen) => ({
        url: `${BASE_URL}/p/${pen.id}`,
        lastModified: pen.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),
      ...profileRows.map((profile) => ({
        url: `${BASE_URL}/u/${profile.username}`,
        changeFrequency: 'weekly' as const,
        priority: 0.5,
      })),
    ]
  } catch {
    // db unavailable at build/request time — still serve the static routes
    return staticRoutes
  }
}
